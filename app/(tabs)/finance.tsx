import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { TODAY, uid } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

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

  // Add expense form
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CatKey>('food');
  const [note, setNote] = useState('');

  // Budget edit
  const [budgetEdits, setBudgetEdits] = useState<Record<string, string>>({});

  // Net worth form
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
    if (!a || a <= 0) { Alert.alert('Enter a valid amount'); return; }
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
    Alert.alert('Delete Expense?', '', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = todayExpenses.filter(e => e.id !== id);
        setTodayExpenses(updated);
        await setData('expenses_' + TODAY(), updated);
        loadData();
      }},
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
    if (!nwName.trim() || isNaN(v) || v <= 0) return;
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
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = { ...netWorth };
        if (type === 'asset') updated.assets = updated.assets.filter(a => a.id !== id);
        else updated.liabilities = updated.liabilities.filter(l => l.id !== id);
        setNetWorth(updated);
        await setData('netWorth', updated);
      }},
    ]);
  };

  const totalAssets = netWorth.assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = netWorth.liabilities.reduce((s, l) => s + l.value, 0);
  const netWorthVal = totalAssets - totalLiabilities;
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const monthTotal = Object.values(monthlyTotals).reduce((s, v) => s + v, 0);
  const monthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <ScrollView style={styles.container}>
      {/* Today */}
      <Card
        title="Today's Spending"
        headerRight={
          <Button title="+ Add" size="sm" onPress={() => { setAmount(''); setNote(''); setCategory('food'); setAddModal(true); }} />
        }
      >
        <View style={styles.totalRow}>
          <Text style={styles.totalAmt}>₹{todayTotal.toFixed(2)}</Text>
          <Text style={styles.totalLabel}>spent today</Text>
        </View>
        {todayExpenses.length === 0
          ? <Text style={styles.emptyText}>No expenses logged yet</Text>
          : todayExpenses.map(e => (
            <TouchableOpacity key={e.id} style={styles.expRow} onLongPress={() => deleteExpense(e.id)}>
              <Text style={styles.expIcon}>{CATS[e.category as CatKey]?.icon || '📝'}</Text>
              <View style={styles.expInfo}>
                <Text style={styles.expNote}>{e.note || CATS[e.category as CatKey]?.label}</Text>
                <Text style={styles.expMeta}>{e.time} · {CATS[e.category as CatKey]?.label}</Text>
              </View>
              <Text style={[styles.expAmt, { color: CATS[e.category as CatKey]?.color || Colors.text }]}>
                ₹{e.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))
        }
      </Card>

      {/* Monthly budget */}
      <Card
        title={`${monthName} Budget`}
        headerRight={
          <Button
            title="Set Budget" size="sm" variant="outline"
            onPress={() => {
              setBudgetEdits(Object.fromEntries(Object.entries(monthlyBudget).map(([k, v]) => [k, String(v)])));
              setBudgetModal(true);
            }}
          />
        }
      >
        <Text style={styles.monthTotal}>₹{monthTotal.toFixed(0)} total this month</Text>
        {(Object.keys(CATS) as CatKey[]).map(cat => {
          const spent = monthlyTotals[cat] || 0;
          const budget = monthlyBudget[cat] || 0;
          if (spent === 0 && budget === 0) return null;
          const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
          const over = budget > 0 && spent > budget;
          return (
            <View key={cat} style={styles.catRow}>
              <View style={styles.catHeader}>
                <Text style={styles.catIcon}>{CATS[cat].icon}</Text>
                <Text style={styles.catName}>{CATS[cat].label}</Text>
                <Text style={[styles.catAmt, { color: over ? Colors.red : CATS[cat].color }]}>
                  ₹{spent.toFixed(0)}{budget > 0 ? ` / ₹${budget}` : ''}
                  {over ? ' ⚠️' : ''}
                </Text>
              </View>
              {budget > 0 && (
                <View style={styles.catBarBg}>
                  <View style={[styles.catBarFill, { width: `${pct}%` as any, backgroundColor: over ? Colors.red : CATS[cat].color }]} />
                </View>
              )}
            </View>
          );
        })}
      </Card>

      {/* Net Worth */}
      <Card
        title="Net Worth"
        headerRight={<Button title="Edit" size="sm" variant="outline" onPress={() => { setNwName(''); setNwValue(''); setNwType('asset'); setNwModal(true); }} />}
      >
        <View style={styles.nwSummaryRow}>
          <View style={styles.nwBox}>
            <Text style={[styles.nwVal, { color: Colors.green }]}>₹{totalAssets.toLocaleString()}</Text>
            <Text style={styles.nwBoxLabel}>ASSETS</Text>
          </View>
          <View style={styles.nwDivider} />
          <View style={styles.nwBox}>
            <Text style={[styles.nwVal, { color: Colors.red }]}>₹{totalLiabilities.toLocaleString()}</Text>
            <Text style={styles.nwBoxLabel}>LIABILITIES</Text>
          </View>
          <View style={styles.nwDivider} />
          <View style={styles.nwBox}>
            <Text style={[styles.nwVal, { color: netWorthVal >= 0 ? Colors.accentLight : Colors.red }]}>
              ₹{netWorthVal.toLocaleString()}
            </Text>
            <Text style={styles.nwBoxLabel}>NET WORTH</Text>
          </View>
        </View>
        {netWorth.assets.map(a => (
          <View key={a.id} style={styles.nwItem}>
            <Text style={styles.nwItemName}>{a.name}</Text>
            <Text style={[styles.nwItemVal, { color: Colors.green }]}>+₹{a.value.toLocaleString()}</Text>
          </View>
        ))}
        {netWorth.liabilities.map(l => (
          <View key={l.id} style={styles.nwItem}>
            <Text style={styles.nwItemName}>{l.name}</Text>
            <Text style={[styles.nwItemVal, { color: Colors.red }]}>−₹{l.value.toLocaleString()}</Text>
          </View>
        ))}
      </Card>

      {/* Add Expense Modal */}
      <ModalSheet visible={addModal} onClose={() => setAddModal(false)} title="Add Expense">
        <FormField label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
        <FormField label="Category">
          <View style={styles.catGrid}>
            {(Object.keys(CATS) as CatKey[]).map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.catChip, category === c && { borderColor: CATS[c].color, backgroundColor: CATS[c].color + '22' }]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.catChipTxt, { color: category === c ? CATS[c].color : Colors.textSecondary }]}>
                  {CATS[c].icon} {CATS[c].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>
        <FormField label="Note (optional)" value={note} onChangeText={setNote} placeholder="What did you buy?" />
        <View style={styles.modalBtns}>
          <Button title="Cancel" variant="outline" onPress={() => setAddModal(false)} />
          <Button title="Add" onPress={addExpense} />
        </View>
      </ModalSheet>

      {/* Budget Modal */}
      <ModalSheet visible={budgetModal} onClose={() => setBudgetModal(false)} title="Monthly Budget Limits">
        {(Object.keys(CATS) as CatKey[]).map(c => (
          <FormField
            key={c} label={`${CATS[c].icon} ${CATS[c].label}`}
            value={budgetEdits[c] || ''}
            onChangeText={v => setBudgetEdits(p => ({ ...p, [c]: v }))}
            keyboardType="decimal-pad" placeholder="0 = no limit"
          />
        ))}
        <View style={styles.modalBtns}>
          <Button title="Cancel" variant="outline" onPress={() => setBudgetModal(false)} />
          <Button title="Save" onPress={saveBudget} />
        </View>
      </ModalSheet>

      {/* Net Worth Modal */}
      <ModalSheet visible={nwModal} onClose={() => setNwModal(false)} title="Edit Net Worth">
        <FormField label="Type">
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, nwType === 'asset' && { borderColor: Colors.green, backgroundColor: Colors.greenBg }]}
              onPress={() => setNwType('asset')}
            >
              <Text style={[styles.typeBtnTxt, nwType === 'asset' && { color: Colors.green }]}>Asset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, nwType === 'liability' && { borderColor: Colors.red, backgroundColor: Colors.redBg }]}
              onPress={() => setNwType('liability')}
            >
              <Text style={[styles.typeBtnTxt, nwType === 'liability' && { color: Colors.red }]}>Liability</Text>
            </TouchableOpacity>
          </View>
        </FormField>
        <FormField label="Name" value={nwName} onChangeText={setNwName} placeholder="e.g. Savings Account" />
        <FormField label="Value (₹)" value={nwValue} onChangeText={setNwValue} keyboardType="decimal-pad" placeholder="0" />
        <Button title="Add Item" onPress={addNetWorthItem} style={{ marginBottom: 16 }} />
        {netWorth.assets.length > 0 && <Text style={styles.sectionLbl}>ASSETS (long-press to delete)</Text>}
        {netWorth.assets.map(a => (
          <TouchableOpacity key={a.id} style={styles.nwItem} onLongPress={() => deleteNwItem('asset', a.id)}>
            <Text style={styles.nwItemName}>{a.name}</Text>
            <Text style={[styles.nwItemVal, { color: Colors.green }]}>+₹{a.value.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
        {netWorth.liabilities.length > 0 && <Text style={styles.sectionLbl}>LIABILITIES (long-press to delete)</Text>}
        {netWorth.liabilities.map(l => (
          <TouchableOpacity key={l.id} style={styles.nwItem} onLongPress={() => deleteNwItem('liability', l.id)}>
            <Text style={styles.nwItemName}>{l.name}</Text>
            <Text style={[styles.nwItemVal, { color: Colors.red }]}>−₹{l.value.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.modalBtns}>
          <Button title="Done" onPress={() => setNwModal(false)} />
        </View>
      </ModalSheet>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 16 },
  totalAmt: { color: Colors.text, fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  totalLabel: { color: Colors.textMuted, fontSize: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
  expRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 6 },
  expIcon: { fontSize: 22 },
  expInfo: { flex: 1 },
  expNote: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  expMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  expAmt: { fontSize: 15, fontWeight: '700' },
  monthTotal: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 16 },
  catRow: { marginBottom: 16 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  catIcon: { fontSize: 16 },
  catName: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  catAmt: { fontSize: 13, fontWeight: '700' },
  catBarBg: { height: 2, backgroundColor: Colors.surfaceHighest, borderRadius: 999 },
  catBarFill: { height: 2, borderRadius: 999 },
  nwSummaryRow: { flexDirection: 'row', marginBottom: 16 },
  nwBox: { flex: 1, alignItems: 'center' },
  nwVal: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  nwBoxLabel: { color: Colors.textMuted, fontSize: 8, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  nwDivider: { width: 1, backgroundColor: Colors.border },
  nwItem: { flexDirection: 'row', paddingVertical: 10, marginBottom: 2 },
  nwItemName: { flex: 1, color: Colors.textSecondary, fontSize: 13 },
  nwItemVal: { fontSize: 13, fontWeight: '700' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  catChipTxt: { fontSize: 12 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  typeBtnTxt: { color: Colors.textSecondary, fontWeight: '600' },
  sectionLbl: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginTop: 12, marginBottom: 6 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
