// components/InvoicePDF.js
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    marginBottom: 10,
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    padding: 4,
    textAlign: 'center',
  },
  total: {
    textAlign: 'right',
    fontWeight: 'bold',
    marginTop: 10,
  },
});

// PDF Component
export default function InvoicePDF({ invoiceData }) {
  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Senfeng Letterhead</Text>
          <Text>Street# 2, Sharif Garden Daroghawala, Lahore</Text>
          <Text>Phone: +92 333 9180410 | Email: Senfenglaserpakistan@gmail.com</Text>
        </View>

        {/* Company and Personal Details */}
        <View style={styles.section}>
          <Text>Company: {invoiceData.company}</Text>
          <Text>Name: {invoiceData.name}</Text>
          <Text>Contact: {invoiceData.contact}</Text>
          <Text>Model: {invoiceData.model}</Text>
          <Text>Serial No: {invoiceData.serialNo}</Text>
          <Text>Manager: {invoiceData.manager}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>DATE</Text>
            <Text style={styles.tableCell}>TID</Text>
            <Text style={styles.tableCell}>BANK</Text>
            <Text style={styles.tableCell}>MODE</Text>
            <Text style={styles.tableCell}>PAYMENT</Text>
            <Text style={styles.tableCell}>BALANCE</Text>
          </View>
          {invoiceData.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.date}</Text>
              <Text style={styles.tableCell}>{item.tid}</Text>
              <Text style={styles.tableCell}>{item.bank}</Text>
              <Text style={styles.tableCell}>{item.mode}</Text>
              <Text style={styles.tableCell}>{item.payment}</Text>
              <Text style={styles.tableCell}>{item.balance}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <Text style={styles.total}>
          Total Amount: Rs. {invoiceData.totalAmount} | Balance: Rs. {invoiceData.balance} | Received: Rs. {invoiceData.received}
        </Text>
      </Page>
    </Document>
  );
}
