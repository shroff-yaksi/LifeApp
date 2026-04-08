import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, TAB_COLORS } from '../../src/constants/theme';
import { TODAY, uid } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';
import { ProgressBar } from '../../src/components/ProgressBar';

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

export default function FinanceScreen() {
  const [todayExpenses, setTodayExpenses] = useState<any[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<Record<string, number>>({});
  const [monthlyBudget, setMonthlyBudget] = useState<Record<string, number>>({});
  const [netWorth, setNetWorth] = useState<{ assets: any[]; liabilities: any[] }>({ assets: [], liabilities: [] });
  const [addModal, setAddModal] = useState(false);
  const [budgetModal, setBudgetModal] = useState(false);
  const [nwModal, setNwModal] = useState(false);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CatKey>('food');
  const [note, setNote] = useState('');
  const [budgetEdits, setBudgetEdits] = useState<Record<string, string>>({});
  const [nwName, setNwName] = useState('');
  const [nwValue, setNwValue] = useState('');
  const [nwType, setNwType] = useState<'asset' | 'liability'>('asset');

  const loadData = useCallback(async () => {
    setTodayExpenses(await getData<any[]>('expenses_' + TODAY(), []));
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
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const addExpense = async () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) { Alert.alert('Invalid Amount', 'Enter a positive amount.'); return; }
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const entry = { id: uid(), amount: a, category, note: note.trim(), date: TODAY(), time, ts: Date.now() };
    const updated = [entry, ...todayExpenses];
    setTodayExpenses(updated);
    await setData('expenses_' + TODAY(), updated);
    setAmount(''); setNote(''); setAddModal(false);
    loadData();
  };

  const deleteExpense = (id: string) => {
    Alert.alert('Delete Expense?', 'This will remove the expense permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = todayExpenses.filter(e => e.id !== id);
          setTodayExpenses(updated);
          await setData('expenses_' + TODAY(), updated);
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
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const monthTotal = Object.values(monthlyTotals).reduce((s, v) => s + v, 0);
  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Net Worth Hero */}
      <Card accentColor={C}>
        <View style={styles.nwHero}>
          <View>
            <Text style={styles.nwHeroLabel}>NET WORTH</Text>
            <Text style={[styles.nwHeroVal, { color: netWorthVal >= 0 ? Colors.green : Colors.red }]}>
              ₹{Math.abs(netWorthVal).toLocaleString()}
            </Text>
            {netWorthVal < 0 && <Text style={{ color: Colors.red, fontSize: 11 }}>in debt</Text>}
          </View>
          <Button title="Edit" size="sm" variant="outline" color={C} onPress={() => { setNwName(''); setNwValue(''); setNwType('asset'); setNwModal(true); }} />
        </View>
        <View style={styles.nwRow}>
          <View style={[styles.nwBox, { backgroundColor: Colors.greenBg, borderColor: Colors.green + '30' }]}>
            <Text style={styles.nwBoxLabel}>ASSETS</Text>
            <Text style={[styles.nwBoxVal, { color: Colors.green }]}>₹{totalAssets.toLocaleString()}</Text>
          </View>
          <View style={[styles.nwBox, { backgroundColor: Colors.redBg, borderColor: Colors.red + '30' }]}>
            <Text style={styles.nwBoxLabel}>LIABILITIES</Text>
            <Text style={[styles.nwBoxVal, { color: Colors.red }]}>₹{totalLiabilities.toLocaleString()}</Text>
          </View>
        </View>
      </Card>

      {/* Today's Spending */}
      <Card
        title="Today's Spending"
        accentColor={Colors.orange}
        headerRight={
          <Button title="+ Add" size="sm" color={Colors.orange} onPress={() => { setAmount(''); setNote(''); setCategory('food'); setAddModal(true); }} />
        }
      >
        <View style={styles.todayTotalRow}>
          <Text style={[styles.todayTotal, { color: Colors.orange }]}>₹{todayTotal.toFixed(2)}</Text>
          <Text style={styles.todayTotalLabel}>spent today</Text>
        </View>
        {todayExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyText}>No expenses logged yet</Text>
          </View>
        ) : todayExpenses.map(e => {
          const cat = CATS[e.category as CatKey] || CATS.other;
          return (
            <View key={e.id} style={styles.expRow}>
              <View style={[styles.expIconBox, { backgroundColor: cat.color + '20' }]}>
                <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
              </View>
              <View style={styles.expInfo}>
                <Text style={styles.expNote}>{e.note || cat.label}</Text>
                <Text style={styles.expMeta}>{e.time}  ·  {cat.label}</Text>
              </View>
              <Text style={[styles.expAmt, { color: cat.color }]}>₹{e.amount.toFixed(0)}</Text>
              <TouchableOpacity onPress={() => deleteExpense(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ color: Colors.textMuted, fontSize: 14, paddingLeft: 8 }}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}
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
        <View style={styles.monthTotalRow}>
          <Text style={styles.monthTotalLabel}>Total spent</Text>
          <Text style={[styles.monthTotalVal, { color: Colors.accentLight }]}>₹{monthTotal.toFixed(0)}</Text>
        </View>
        {(Object.keys(CATS) as CatKey[]).map(cat => {
          const spent = monthlyTotals[cat] || 0;
          const budget = monthlyBudget[cat] || 0;
          if (spent === 0 && budget === 0) return null;
          const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
          const over = budget > 0 && spent > budget;
          return (
            <View key={cat} style={styles.catRow}>
              <View style={styles.catHeader}>
                <Text style={{ fontSize: 16 }}>{CATS[cat].icon}</Text>
                <Text style={styles.catName}>{CATS[cat].label}</Text>
                <Text style={[styles.catAmt, { color: over ? Colors.red : CATS[cat].color }]}>
                  ₹{spent.toFixed(0)}{budget > 0 ? `  /  ₹${budget}` : ''}
                  {over ? '  ⚠️' : ''}
                </Text>
              </View>
              {budget > 0 && (
                <ProgressBar
                  progress={pct}
                  color={over ? Colors.red : CATS[cat].color}
                  height={5}
                />
              )}
            </View>
          );
        })}
      </Card>

      {/* Add Expense Modal */}
      <ModalSheet visible={addModal} onClose={() => setAddModal(false)} title="Add Expense" accentColor={Colors.orange}>
        <FormField label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" />
        <FormField label="Category">
          <View style={styles.catGrid}>
            {(Object.keys(CATS) as CatKey[]).map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.catChip, category === c && { borderColor: CATS[c].color, backgroundColor: CATS[c].color + '20' }]}
                onPress={() => setCategory(c)}
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
            >
              <Text style={{ fontSize: 18 }}>📈</Text>
              <Text style={[styles.typeBtnTxt, nwType === 'asset' && { color: Colors.green }]}>Asset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, nwType === 'liability' && { borderColor: Colors.red, backgroundColor: Colors.redBg }]}
              onPress={() => setNwType('liability')}
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
                <Text style={[styles.nwItemVal, { color: Colors.green }]}>+₹{a.value.toLocaleString()}</Text>
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
                <Text style={[styles.nwItemVal, { color: Colors.red }]}>−₹{l.value.toLocaleString()}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  nwHero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  nwHeroLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 4 },
  nwHeroVal: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  nwRow: { flexDirection: 'row', gap: 10 },
  nwBox: { flex: 1, borderRadius: 14, padding: 12, borderWidth: 1, alignItems: 'center' },
  nwBoxLabel: { color: Colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 4 },
  nwBoxVal: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  todayTotalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 16 },
  todayTotal: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  todayTotalLabel: { color: Colors.textMuted, fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyIcon: { fontSize: 28, marginBottom: 6 },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
  expRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 6 },
  expIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expInfo: { flex: 1 },
  expNote: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  expMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  expAmt: { fontSize: 14, fontWeight: '800' },
  monthTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthTotalLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  monthTotalVal: { fontSize: 18, fontWeight: '800' },
  catRow: { marginBottom: 14 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  catName: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  catAmt: { fontSize: 12, fontWeight: '700' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceHigh,
  },
  catChipTxt: { fontSize: 11, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
  },
  typeBtnTxt: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
  sectionLbl: { color: Colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginTop: 12, marginBottom: 8 },
  sectionHint: { color: Colors.textMuted, fontSize: 9, textAlign: 'center', marginTop: 8 },
  nwItem: { flexDirection: 'row', paddingVertical: 10, backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, marginBottom: 4 },
  nwItemName: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  nwItemVal: { fontSize: 13, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
