import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, LayoutChangeEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Colors, TAB_COLORS, radius, heroGradient } from '../../src/constants/theme';
import { TODAY, addDays, uid, hexToRgba } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';
import { ProgressBar } from '../../src/components/ProgressBar';
import { DonutChart } from '../../src/components/DonutChart';
import { AreaChart } from '../../src/components/AreaChart';

const C = TAB_COLORS.finance; // teal

const CATS = {
  food:          { label: 'Food & Dining',  icon: '🍔', color: Colors.orange },
  transport:     { label: 'Transport',       icon: '🚗', color: Colors.cyan },
  entertainment: { label: 'Entertainment',   icon: '🎮', color: Colors.purple },
  health:        { label: 'Health',          icon: '💊', color: Colors.green },
  shopping:      { label: 'Shopping',        icon: '🛍️', color: Colors.pink },
  bills:         { label: 'Bills',           icon: '💡', color: Colors.yellow },
  investment:    { label: 'Investment',      icon: '📈', color: Colors.accentLight },
  other:         { label: 'Other',           icon: '📝', color: Colors.textSecondary },
} as const;

type CatKey = keyof typeof CATS;

const money = (n: number) => `₹${Math.round(n).toLocaleString()}`;

function getMonthKey() { return TODAY().slice(0, 7); }

function getDaysOfMonth(monthKey: string): string[] {
  const [y, m] = monthKey.split('-').map(Number);
  const days: string[] = [];
  const d = new Date(y, m - 1, 1);
  while (d.getMonth() === m - 1) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// ── Net Worth hero — gradient surface, restrained accent glow, top hairline ──
function NetWorthHero({ net, assets, liabilities, onEdit }: {
  net: number; assets: number; liabilities: number; onEdit: () => void;
}) {
  const total = assets + liabilities || 1;
  const positive = net >= 0;
  return (
    <View style={styles.hero}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="finHeroBg" x1="0" y1="0" x2="0.35" y2="1">
            <Stop offset="0" stopColor={heroGradient.colors[0]} />
            <Stop offset="1" stopColor={heroGradient.colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#finHeroBg)" />
      </Svg>
      <View style={[styles.heroGlow, { backgroundColor: C }]} pointerEvents="none" />
      <View style={styles.heroHairline} pointerEvents="none" />

      <View style={styles.heroTop}>
        <Text style={styles.heroLabel}>NET WORTH</Text>
        <Button title="Edit" size="sm" variant="outline" color={C} onPress={onEdit} />
      </View>
      <Text style={[styles.heroVal, { color: positive ? Colors.green : Colors.red }]}>
        {positive ? '' : '−'}{money(Math.abs(net))}
      </Text>
      {!positive && <Text style={styles.heroDebt}>in debt</Text>}

      {/* proportion bar — assets vs liabilities */}
      <View style={styles.splitBar}>
        <View style={{ width: `${(assets / total) * 100}%`, backgroundColor: Colors.green }} />
        <View style={{ width: `${(liabilities / total) * 100}%`, backgroundColor: Colors.red }} />
      </View>

      <View style={styles.nwRow}>
        <View style={styles.nwTile}>
          <View style={styles.nwTileHead}>
            <View style={[styles.dot, { backgroundColor: Colors.green }]} />
            <Text style={styles.nwTileLabel}>ASSETS</Text>
          </View>
          <Text style={[styles.nwTileVal, { color: Colors.green }]}>{money(assets)}</Text>
        </View>
        <View style={styles.nwTile}>
          <View style={styles.nwTileHead}>
            <View style={[styles.dot, { backgroundColor: Colors.red }]} />
            <Text style={styles.nwTileLabel}>LIABILITIES</Text>
          </View>
          <Text style={[styles.nwTileVal, { color: Colors.red }]}>{money(liabilities)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function FinanceScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(TODAY());
  const [expenses, setExpenses] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ date: string; total: number }[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<Record<string, number>>({});
  const [monthlyBudget, setMonthlyBudget] = useState<Record<string, number>>({});
  const [netWorth, setNetWorth] = useState<{ assets: any[]; liabilities: any[] }>({ assets: [], liabilities: [] });
  const [addModal, setAddModal] = useState(false);
  const [budgetModal, setBudgetModal] = useState(false);
  const [nwModal, setNwModal] = useState(false);
  const [chartW, setChartW] = useState(0);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CatKey>('food');
  const [note, setNote] = useState('');
  const [budgetEdits, setBudgetEdits] = useState<Record<string, string>>({});
  const [nwName, setNwName] = useState('');
  const [nwValue, setNwValue] = useState('');
  const [nwType, setNwType] = useState<'asset' | 'liability'>('asset');

  const isToday = selectedDate === TODAY();

  const loadExpenses = useCallback(async (date: string) => {
    setExpenses(await getData<any[]>('expenses_' + date, []));
  }, []);

  const loadData = useCallback(async () => {
    await loadExpenses(selectedDate);

    // Weekly spending (last 7 days ending today)
    const weekly: { date: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(TODAY(), -i);
      const exps = await getData<any[]>('expenses_' + d, []);
      weekly.push({ date: d, total: exps.reduce((s, e) => s + e.amount, 0) });
    }
    setWeeklyData(weekly);

    // Monthly totals for budget card
    const mk = getMonthKey();
    setMonthlyBudget(await getData('budget_' + mk, {}));
    const days = getDaysOfMonth(mk);
    const totals: Record<string, number> = {};
    for (const day of days) {
      const exps = await getData<any[]>('expenses_' + day, []);
      exps.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
    }
    setMonthlyTotals(totals);
    setNetWorth(await getData('netWorth', { assets: [], liabilities: [] }));
  }, [selectedDate, loadExpenses]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  const navigateDate = useCallback(async (dir: -1 | 1) => {
    const newDate = addDays(selectedDate, dir);
    if (newDate > TODAY()) return;
    setSelectedDate(newDate);
    setExpenses(await getData<any[]>('expenses_' + newDate, []));
  }, [selectedDate]);

  const addExpense = async () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) { Alert.alert('Invalid Amount', 'Enter a positive amount.'); return; }
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const entry = { id: uid(), amount: a, category, note: note.trim(), date: selectedDate, time, ts: Date.now() };
    const updated = [entry, ...expenses];
    setExpenses(updated);
    await setData('expenses_' + selectedDate, updated);
    setAmount(''); setNote(''); setAddModal(false);
    loadData();
  };

  const deleteExpense = (id: string) => {
    Alert.alert('Delete Expense?', 'This will remove the expense permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = expenses.filter(e => e.id !== id);
          setExpenses(updated);
          await setData('expenses_' + selectedDate, updated);
          loadData();
        },
      },
    ]);
  };

  const saveBudget = async () => {
    const updated: Record<string, number> = { ...monthlyBudget };
    Object.entries(budgetEdits).forEach(([k, v]) => { const n = parseFloat(v); if (!isNaN(n) && n > 0) updated[k] = n; });
    await setData('budget_' + getMonthKey(), updated);
    setMonthlyBudget(updated);
    setBudgetModal(false);
  };

  const addNetWorthItem = async () => {
    const v = parseFloat(nwValue);
    if (!nwName.trim() || isNaN(v) || v <= 0) { Alert.alert('Invalid', 'Enter a name and positive value.'); return; }
    const item = { id: uid(), name: nwName.trim(), value: v };
    const updated = { ...netWorth };
    if (nwType === 'asset') updated.assets = [...updated.assets, item];
    else updated.liabilities = [...updated.liabilities, item];
    setNetWorth(updated);
    await setData('netWorth', updated);
    setNwName(''); setNwValue('');
  };

  const deleteNwItem = (type: 'asset' | 'liability', id: string) => {
    Alert.alert('Delete Item?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = { ...netWorth };
          if (type === 'asset') updated.assets = updated.assets.filter(a => a.id !== id);
          else updated.liabilities = updated.liabilities.filter(l => l.id !== id);
          setNetWorth(updated);
          await setData('netWorth', updated);
        },
      },
    ]);
  };

  const totalAssets = netWorth.assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = netWorth.liabilities.reduce((s, l) => s + l.value, 0);
  const netWorthVal = totalAssets - totalLiabilities;
  const dayTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const monthTotal = Object.values(monthlyTotals).reduce((s, v) => s + v, 0);
  const monthBudgetTotal = Object.values(monthlyBudget).reduce((s, v) => s + v, 0);
  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const weekTotal = useMemo(() => weeklyData.reduce((s, d) => s + d.total, 0), [weeklyData]);
  const weekAvg = weeklyData.length ? weekTotal / weeklyData.length : 0;

  const donutSegments = useMemo(
    () => (Object.keys(CATS) as CatKey[])
      .filter(c => (monthlyTotals[c] || 0) > 0)
      .map(c => ({ value: monthlyTotals[c], color: CATS[c].color })),
    [monthlyTotals]
  );

  const budgetRows = (Object.keys(CATS) as CatKey[]).filter(
    cat => (monthlyTotals[cat] || 0) > 0 || (monthlyBudget[cat] || 0) > 0
  );

  const formatDateLabel = (d: string) => {
    if (d === TODAY()) return 'Today';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
  };

  const formatSelectedDate = () => {
    if (selectedDate === TODAY()) return 'Today';
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C} />}>
      <NetWorthHero
        net={netWorthVal}
        assets={totalAssets}
        liabilities={totalLiabilities}
        onEdit={() => { setNwName(''); setNwValue(''); setNwType('asset'); setNwModal(true); }}
      />

      {/* Daily Expenses */}
      <Card
        title="Daily Expenses"
        accentColor={Colors.orange}
        headerRight={
          <Button title="+ Add" size="sm" color={Colors.orange} onPress={() => { setAmount(''); setNote(''); setCategory('food'); setAddModal(true); }} />
        }
      >
        {/* Date navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.dateNavBtn} activeOpacity={0.6}>
            <Text style={styles.dateNavArrow}>‹</Text>
          </TouchableOpacity>
          <View style={styles.dateNavCenter}>
            <Text style={styles.dateNavLabel}>{formatSelectedDate()}</Text>
            {!isToday && (
              <TouchableOpacity onPress={() => { setSelectedDate(TODAY()); loadExpenses(TODAY()); }}>
                <Text style={[styles.dateNavToday, { color: Colors.orange }]}>Jump to today</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => navigateDate(1)} style={[styles.dateNavBtn, isToday && { opacity: 0.2 }]} disabled={isToday} activeOpacity={0.6}>
            <Text style={styles.dateNavArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dayTotalCard}>
          <Text style={[styles.dayTotal, { color: Colors.orange }]}>{money(dayTotal)}</Text>
          <Text style={styles.dayTotalLabel}>spent{isToday ? ' today' : ' this day'}</Text>
        </View>

        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyText}>No expenses logged</Text>
          </View>
        ) : expenses.map(e => {
          const cat = CATS[e.category as CatKey] || CATS.other;
          return (
            <View key={e.id} style={styles.expRow}>
              <View style={[styles.expIconBox, { backgroundColor: hexToRgba(cat.color, 0.14) }]}>
                <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
              </View>
              <View style={styles.expInfo}>
                <Text style={styles.expNote} numberOfLines={1}>{e.note || cat.label}</Text>
                <Text style={styles.expMeta}>{e.time}  ·  {cat.label}</Text>
              </View>
              <Text style={[styles.expAmt, { color: cat.color }]}>{money(e.amount)}</Text>
              <TouchableOpacity onPress={() => deleteExpense(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.expDelete}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </Card>

      {/* 7-Day Spending */}
      <Card title="Last 7 Days" accentColor={C}>
        <View style={styles.weekStatRow}>
          <View>
            <Text style={styles.weekStatLabel}>WEEK TOTAL</Text>
            <Text style={[styles.weekStatVal, { color: C }]}>{money(weekTotal)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.weekStatLabel}>DAILY AVG</Text>
            <Text style={styles.weekStatSub}>{money(weekAvg)}</Text>
          </View>
        </View>

        <View style={styles.chartWrap} onLayout={(e: LayoutChangeEvent) => setChartW(e.nativeEvent.layout.width)}>
          {chartW > 0 && (
            <AreaChart data={weeklyData.map(d => d.total)} width={chartW} height={68} color={C} min={0} />
          )}
        </View>

        <View style={styles.daySelectorRow}>
          {weeklyData.map(({ date, total }) => {
            const sel = date === selectedDate;
            return (
              <TouchableOpacity
                key={date}
                style={[styles.dayPill, sel && { backgroundColor: hexToRgba(C, 0.16), borderColor: hexToRgba(C, 0.22) }]}
                onPress={() => { setSelectedDate(date); loadExpenses(date); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayPillLbl, sel && { color: C, fontWeight: '800' }]}>
                  {date === TODAY() ? 'Now' : formatDateLabel(date).replace(/^\w+ /, '')}
                </Text>
                <Text style={[styles.dayPillAmt, { color: total > 0 ? (sel ? C : Colors.textSecondary) : Colors.textMuted }]}>
                  {total > 0 ? `₹${Math.round(total)}` : '—'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Monthly Budget */}
      <Card
        title={monthName + ' Budget'}
        accentColor={Colors.accentLight}
        headerRight={
          <Button
            title="Set Budget" size="sm" variant="outline" color={Colors.accentLight}
            onPress={() => {
              setBudgetEdits(Object.fromEntries(Object.entries(monthlyBudget).map(([k, v]) => [k, String(v)])));
              setBudgetModal(true);
            }}
          />
        }
      >
        {monthTotal === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>Nothing spent this month yet</Text>
          </View>
        ) : (
          <>
            <View style={styles.budgetHead}>
              <DonutChart segments={donutSegments} size={124} strokeWidth={13}>
                <Text style={styles.donutVal}>{money(monthTotal)}</Text>
                <Text style={styles.donutSub}>spent</Text>
              </DonutChart>
              <View style={styles.budgetSummary}>
                <Text style={styles.budgetSumLabel}>OF BUDGET</Text>
                <Text style={styles.budgetSumVal}>
                  {monthBudgetTotal > 0 ? money(monthBudgetTotal) : 'No limit set'}
                </Text>
                {monthBudgetTotal > 0 && (
                  <>
                    <View style={{ marginTop: 8 }}>
                      <ProgressBar
                        progress={(monthTotal / monthBudgetTotal) * 100}
                        color={monthTotal > monthBudgetTotal ? Colors.red : Colors.accentLight}
                        height={6}
                      />
                    </View>
                    <Text style={[styles.budgetRemain, { color: monthTotal > monthBudgetTotal ? Colors.red : Colors.textSecondary }]}>
                      {monthTotal > monthBudgetTotal
                        ? `${money(monthTotal - monthBudgetTotal)} over`
                        : `${money(monthBudgetTotal - monthTotal)} left`}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {budgetRows.map(cat => {
              const spent = monthlyTotals[cat] || 0;
              const budget = monthlyBudget[cat] || 0;
              const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
              const over = budget > 0 && spent > budget;
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={styles.catHeader}>
                    <View style={[styles.catDot, { backgroundColor: CATS[cat].color }]} />
                    <Text style={styles.catName}>{CATS[cat].label}</Text>
                    <Text style={[styles.catAmt, { color: over ? Colors.red : Colors.text }]}>
                      {money(spent)}{budget > 0 ? ` / ${money(budget)}` : ''}{over ? ' ⚠️' : ''}
                    </Text>
                  </View>
                  {budget > 0 && (
                    <ProgressBar progress={pct} color={over ? Colors.red : CATS[cat].color} height={5} />
                  )}
                </View>
              );
            })}
          </>
        )}
      </Card>

      {/* Add Expense Modal */}
      <ModalSheet visible={addModal} onClose={() => setAddModal(false)} title="Add Expense" accentColor={Colors.orange}>
        <FormField label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" />
        <FormField label="Category">
          <View style={styles.catGrid}>
            {(Object.keys(CATS) as CatKey[]).map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.catChip, category === c && { borderColor: CATS[c].color, backgroundColor: hexToRgba(CATS[c].color, 0.16) }]}
                onPress={() => setCategory(c)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14 }}>{CATS[c].icon}</Text>
                <Text style={[styles.catChipTxt, { color: category === c ? CATS[c].color : Colors.textSecondary }]}>
                  {CATS[c].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>
        <FormField label="Note (optional)" value={note} onChangeText={setNote} placeholder="What did you buy?" />
        <View style={styles.modalBtns}>
          <Button title="Cancel" variant="outline" onPress={() => setAddModal(false)} />
          <Button title="Add Expense" onPress={addExpense} color={Colors.orange} />
        </View>
      </ModalSheet>

      {/* Budget Modal */}
      <ModalSheet visible={budgetModal} onClose={() => setBudgetModal(false)} title="Set Monthly Budgets" accentColor={Colors.accentLight}>
        {(Object.keys(CATS) as CatKey[]).map(c => (
          <FormField
            key={c}
            label={`${CATS[c].icon} ${CATS[c].label}`}
            value={budgetEdits[c] || ''}
            onChangeText={v => setBudgetEdits(p => ({ ...p, [c]: v }))}
            keyboardType="decimal-pad"
            placeholder="0 = no limit"
          />
        ))}
        <View style={styles.modalBtns}>
          <Button title="Cancel" variant="outline" onPress={() => setBudgetModal(false)} />
          <Button title="Save" onPress={saveBudget} color={Colors.accentLight} />
        </View>
      </ModalSheet>

      {/* Net Worth Modal */}
      <ModalSheet visible={nwModal} onClose={() => setNwModal(false)} title="Edit Net Worth" accentColor={C}>
        <FormField label="Type">
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, nwType === 'asset' && { borderColor: Colors.green, backgroundColor: Colors.greenBg }]}
              onPress={() => setNwType('asset')}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18 }}>📈</Text>
              <Text style={[styles.typeBtnTxt, nwType === 'asset' && { color: Colors.green }]}>Asset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, nwType === 'liability' && { borderColor: Colors.red, backgroundColor: Colors.redBg }]}
              onPress={() => setNwType('liability')}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18 }}>💳</Text>
              <Text style={[styles.typeBtnTxt, nwType === 'liability' && { color: Colors.red }]}>Liability</Text>
            </TouchableOpacity>
          </View>
        </FormField>
        <FormField label="Name" value={nwName} onChangeText={setNwName} placeholder="e.g. Savings Account" />
        <FormField label="Value (₹)" value={nwValue} onChangeText={setNwValue} keyboardType="decimal-pad" placeholder="0" />
        <Button title="+ Add Item" onPress={addNetWorthItem} color={C} style={{ marginBottom: 20 }} />

        {netWorth.assets.length > 0 && (
          <>
            <Text style={styles.sectionLbl}>ASSETS</Text>
            {netWorth.assets.map(a => (
              <TouchableOpacity key={a.id} style={styles.nwItem} onLongPress={() => deleteNwItem('asset', a.id)}>
                <Text style={styles.nwItemName}>{a.name}</Text>
                <Text style={[styles.nwItemVal, { color: Colors.green }]}>+{money(a.value)}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
        {netWorth.liabilities.length > 0 && (
          <>
            <Text style={styles.sectionLbl}>LIABILITIES</Text>
            {netWorth.liabilities.map(l => (
              <TouchableOpacity key={l.id} style={styles.nwItem} onLongPress={() => deleteNwItem('liability', l.id)}>
                <Text style={styles.nwItemName}>{l.name}</Text>
                <Text style={[styles.nwItemVal, { color: Colors.red }]}>−{money(l.value)}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
        <Text style={styles.sectionHint}>Long-press an item to delete it</Text>
        <View style={styles.modalBtns}>
          <Button title="Done" onPress={() => setNwModal(false)} color={C} />
        </View>
      </ModalSheet>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const label = { fontSize: 9, fontWeight: '800' as const, letterSpacing: 1, textTransform: 'uppercase' as const };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },

  // Net Worth hero
  hero: {
    backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1,
    borderRadius: radius.lg, padding: 16, marginBottom: 12, overflow: 'hidden', position: 'relative',
  },
  heroGlow: { position: 'absolute', top: -70, right: -50, width: 190, height: 190, borderRadius: 95, opacity: 0.13 },
  heroHairline: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: Colors.innerHighlight },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { ...label, color: Colors.textSecondary, letterSpacing: 1.5 },
  heroVal: { fontSize: 38, fontWeight: '800', letterSpacing: -1.2, marginTop: 8 },
  heroDebt: { color: Colors.red, fontSize: 11, fontWeight: '600', marginTop: 2 },
  splitBar: { flexDirection: 'row', height: 6, borderRadius: 999, overflow: 'hidden', backgroundColor: Colors.surfaceHighest, marginTop: 14, marginBottom: 14 },
  nwRow: { flexDirection: 'row', gap: 10 },
  nwTile: { flex: 1, backgroundColor: Colors.surface, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: Colors.border },
  nwTileHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  nwTileLabel: { ...label, fontSize: 8, color: Colors.textMuted },
  nwTileVal: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  // Daily expenses
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dateNavBtn: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  dateNavArrow: { color: Colors.textSecondary, fontSize: 20, fontWeight: '500', lineHeight: 22 },
  dateNavCenter: { alignItems: 'center' },
  dateNavLabel: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  dateNavToday: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  dayTotalCard: { alignItems: 'center', paddingVertical: 14, backgroundColor: Colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  dayTotal: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  dayTotalLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  emptyState: { alignItems: 'center', paddingVertical: 22 },
  emptyIcon: { fontSize: 28, marginBottom: 6 },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: Colors.surface, borderRadius: radius.sm, padding: 11, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  expIconBox: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  expInfo: { flex: 1 },
  expNote: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  expMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  expAmt: { fontSize: 14, fontWeight: '800' },
  expDelete: { color: Colors.textMuted, fontSize: 14, paddingLeft: 6 },

  // Weekly
  weekStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  weekStatLabel: { ...label, fontSize: 8.5, color: Colors.textMuted, marginBottom: 3 },
  weekStatVal: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  weekStatSub: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  chartWrap: { height: 68, marginBottom: 10 },
  daySelectorRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  dayPill: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent' },
  dayPillLbl: { color: Colors.textSecondary, fontSize: 10, fontWeight: '600' },
  dayPillAmt: { fontSize: 10, fontWeight: '700' },

  // Monthly budget
  budgetHead: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 18 },
  donutVal: { color: Colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.4 },
  donutSub: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
  budgetSummary: { flex: 1 },
  budgetSumLabel: { ...label, fontSize: 8.5, color: Colors.textMuted, marginBottom: 3 },
  budgetSumVal: { color: Colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  budgetRemain: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  catRow: { marginBottom: 13 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { flex: 1, color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  catAmt: { fontSize: 12, fontWeight: '700' },

  // Chips & modals
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceHigh },
  catChipTxt: { fontSize: 11, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 4, backgroundColor: Colors.surface },
  typeBtnTxt: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
  sectionLbl: { ...label, letterSpacing: 0.8, color: Colors.textMuted, marginTop: 12, marginBottom: 8 },
  sectionHint: { color: Colors.textMuted, fontSize: 9, textAlign: 'center', marginTop: 8 },
  nwItem: { flexDirection: 'row', paddingVertical: 10, backgroundColor: Colors.surface, borderRadius: radius.sm, paddingHorizontal: 12, marginBottom: 4 },
  nwItemName: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  nwItemVal: { fontSize: 13, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
