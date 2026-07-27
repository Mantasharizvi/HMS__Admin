import { createContext, useContext, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from './ToastContext';
import { validateForm, rules, isValid } from '../utils/validators';
import api from '../services/api';

const PharmacyContext = createContext(null);

// `id` is the MongoDB _id (Mongoose virtual) - used for edit/delete.
// `medicineCode`/`purchaseCode`/`saleCode` (e.g. "MED-101") are the display codes.
export const inventoryColumns = [
  { key: 'medicineCode', header: 'Medicine ID' },
  { key: 'name', header: 'Medicine' },
  { key: 'category', header: 'Category' },
  { key: 'stock', header: 'Stock' },
  { key: 'unit', header: 'Unit' },
  { key: 'expiry', header: 'Expiry' },
];

const emptyMedicine = {
  name: '', category: '', batch: '', expiry: '', purchasePrice: '', sellingPrice: '', stock: '', supplier: '',
};
const medicineSchema = {
  name: [rules.required('Medicine name is required')],
  category: [rules.required('Category is required')],
  expiry: [rules.required('Expiry date is required')],
  stock: [rules.required('Initial stock is required'), rules.numeric(), rules.positive()],
};

const emptyPurchase = { supplier: '', medicine: '', qty: '', cost: '', category: '', unit: '', expiry: '' };
const purchaseSchema = {
  supplier: [rules.required('Supplier is required')],
  medicine: [rules.required('Please select a medicine')],
  qty: [rules.required('Quantity is required'), rules.numeric(), rules.positive()],
  cost: [rules.required('Cost is required'), rules.numeric(), rules.positive()],
};

const emptySale = { patient: '', medicine: '', qty: '', amount: '' };
const saleSchema = {
  patient: [rules.required('Patient name is required')],
  medicine: [rules.required('Please select a medicine')],
  qty: [rules.required('Quantity is required'), rules.numeric(), rules.positive()],
  amount: [rules.required('Amount is required'), rules.numeric(), rules.positive()],
};

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Maps common Excel header variations to this app's canonical field names,
// so an uploaded "Purchase ID" / "purchase_id" /