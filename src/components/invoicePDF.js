import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer';
import { FaPhone, FaGlobe } from 'react-icons/fa';
import { Box } from '@chakra-ui/react';



const InvoicePDF = ({ companyName, name, phoneNumber, address, manager, nextInvoice, invoiceItems, totalAmount }) => {


  return (
    <Document>
      <Page style={{
        padding: 20,
        width: '100%',
      }}>
        {/* Header */}
        <Header />
        <View style={{ padding: '5px', borderWidth: 2, borderColor: '#0072BC', borderRadius: 20, paddingTop: 20 }}>
          {/* Company Details */}
          <CompanyDetails />

          {/* Form Fields */}
          <FormField companyName={companyName} name={name} phoneNumber={phoneNumber} address={address} manager={manager} inv={nextInvoice} />

          {/* Invoice Table */}
          <View style={{ width: '100%' }}>
            <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: '#0072BC', border: '1px solid #D1D5DB', }}>
              {['Sr.', 'Description', 'Quantity', 'Unit Price', 'Amount'].map((header, index) => (
                <View key={index} style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 25, paddingLeft: 5, width: index == 0 ? 30 : index == 1 ? 200 : 100, borderLeftWidth: index !== 0 && 1, borderLeftColor: "#D1D5DB" }]}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: 'white' }}>{header}</Text>
                </View>
              ))}
            </View>

            {invoiceItems.map((item, index) => (
              <View key={index} style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: index % 2 === 0 ? "#f1f1f1" : "white", border: '1px solid #D1D5DB', borderTopWidth: index !== 0 && 0 }}>
                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 30, }]}>
                  <Text style={{ fontSize: 10, color: 'black' }}>{index + 1}</Text>
                </View>
                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 200, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]}>
                  <Text style={{ fontSize: 10, color: 'black' }}>{item?.description}</Text>
                </View>
                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]}>
                  <Text style={{ fontSize: 10, color: 'black' }}>{item?.qty}</Text>
                </View>
                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]}>
                  <Text style={{ fontSize: 10, color: 'black' }}>{item?.price}</Text>
                </View>
                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]}>
                  <Text style={{ fontSize: 10, color: 'black' }}>{item?.total}</Text>
                </View>
              </View>
            ))}

            {invoiceItems.length <= 10 && [...Array(10 - invoiceItems.length)].map((_, i) => (
              <View key={i} style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: i % 2 === 0 ? "#f1f1f1" : "white", border: '1px solid #D1D5DB', borderTopWidth: i !== 0 && 0 }}>
                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 30, }]}>
                  <Text style={{ fontSize: 10, color: 'black' }}>{i + invoiceItems.length + 1}</Text>
                </View>
                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 200, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]} />
                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]} />
                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]} />
                <View style={[{ textAlign: 'left', display: 'flex', justifyContent: 'center', height: 20, paddingLeft: 5, width: 100, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }]} />
              </View>

            ))}
          </View>

          {/* Total Amount */}
          <View style={{ display: 'flex', width: '100%', alignItems: 'flex-end', justifyContent: 'flex-end', marginBottom: 5,  }}>
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <View style={{  backgroundColor: '#0072BC', color: 'white', paddingLeft: 5, height: 35, display: 'flex', justifyContent: 'center', width: 100,}}>
                <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold" }}>Total Amount</Text>
              </View>
              <View style={{  backgroundColor: '#0072BC', color: 'white', paddingLeft: 10, height: 35, display: 'flex', justifyContent: 'center', borderLeftWidth: 1, borderColor: 'white', width: 110, }}>
                <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold" }}>{totalAmount && new Intl.NumberFormat('en-US').format(totalAmount)}/-</Text>
              </View>
            </View>
          </View>

          <BankDetail />

          <Disclaimer />

        </View>
        <Footer />
      </Page>
    </Document>
  );
};


const BankDetail = () => {
  const list = [
    {
      title: "Bank",
      value: "United Bank Limited (UBL)"
    },
    {
      title: "Account Title",
      value: "SENFENG PAKISTAN"
    },
    {
      title: "Account Number",
      value: "321618245"
    },
    {
      title: "IBAN",
      value: "PK33UNIL0109000321618245"
    },
    {
      title: "Branch Code",
      value: "0508"
    },

  ]

  return (
    <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
      {list.map((item, index) => (
        <View key={index} style={{ display: 'flex', flexDirection: 'row', backgroundColor: (index + 1) % 2 === 0 && '#FFE4E1', borderWidth: 1, borderColor: '#cccccc', }}>
          <View style={{ width: 170, height: 20, paddingLeft: 5, justifyContent: 'center', }}>
            <Text style={{ fontSize: 10 }}>{item.title}</Text>
          </View>
          <View style={{ width: 250, height: 20, paddingLeft: 5, justifyContent: 'center', borderLeftWidth: 1, borderColor: '#cccccc', }}>
            <Text style={{ fontSize: 10, color: '#0072BC', fontFamily: 'Helvetica-Bold', }}>{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

const FormField = ({ phoneNumber, address, companyName, name, manager, inv }) => {
  return (
    <View style={{ marginBottom: 5 }}>
      {['Company', 'Name', 'Contact', 'Address', 'Manager', 'Invoice No'].map((label, index) => (
        <View key={label} style={{ display: 'flex', flexDirection: 'column', marginBottom: 5 }}>
          <Text style={{ color: '#7F7F7FFF', marginLeft: 10, fontFamily: 'Helvetica-Bold', fontSize: 11 }}>{label}:</Text>
          <View style={{ backgroundColor: '#dce4f1', paddingLeft: 10, border: '1px solid #E5E7EB', maxWidth: '360px', height: 20, fontSize: 11, display: 'flex', justifyContent: 'center', }}>
            <Text>
              {index == 0 ? companyName : index == 1 ? name : index == 2 ? phoneNumber : index == 3 ? address : index == 4 ? manager : index == 5 ? inv : ""}
            </Text>
          </View>

        </View>
      ))}
    </View>
  )
}

const CompanyDetails = () => {

  return (
    <View style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', }}>
      <View style={{ marginRight: 10, gap: 0, fontSize: '10px', }}>
        <Text style={{
          fontFamily: 'Helvetica-Bold', color: '#0072BC',
          fontSize: 12,
        }}>SENFENG PAKISTAN</Text>
        <Text style={{ color: '#7F7F7FFF', fontWeight: '600', fontSize: 10 }}>Street# 2, Sharif Garden Daroghawala,</Text>
        <Text style={{ color: '#7F7F7FFF', fontWeight: '600', fontSize: 10 }}>Lahore, Punjab 54000, Pakistan</Text>
        <Text style={{ color: '#7F7F7FFF', fontWeight: '600', fontSize: 10 }}>senfenglaserpakistan@gmail.com</Text>
      </View>
    </View>
  )
}

const Header = () => {
  return (
    <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexDirection: 'row' }}>
      {/* <Text fontSize={60} color={'#0072BC'} fontWeight={'800'}>SENFENG</Text> */}
      <Image src={"/logo.png"} alt="My Local Image" style={{ height: '40px', width: '200px' }} />
      <Box style={{ backgroundColor: '#0072BC', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginRight: 70, width: '150px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
        <Text style={{ fontSize: '15px', fontFamily: 'Helvetica-Bold', color: 'white', }}>
          INVOICE
        </Text>
      </Box>
    </View>
  )
}

const Disclaimer = () => {
  return (
    <View style={{ color: '#0072BC', fontWeight: '600', fontSize: 10, width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
      <Text style={{ textAlign: 'center' }}>DISCLAIMER: This is an auto generated Invoice and does not require a signature.</Text>
    </View>
  )
}

const Footer = () => {
  return (
    < View style={{ paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0072BC', flexDirection: 'row' }} >
      <View style={{ fontWeight: '600', fontSize: 18, display: 'flex', alignItems: 'center', gap: 5, flexDirection: 'row' }}>
        <Svg viewBox='0 0 48 48' width="15" height="15">
          <Path fill='#0072bc' d='M13.25 21.59a30.12 30.12 0 0 0 13.18 13.17l4.4-4.41c.55-.55 1.34-.71 2.03-.49C35.1 30.6 37.51 31 40 31c1.11 0 2 .89 2 2v7c0 1.11-.89 2-2 2C21.22 42 6 26.78 6 8a2 2 0 0 1 2-2h7c1.11 0 2 .89 2 2 0 2.49.4 4.9 1.14 7.14.22.69.06 1.48-.49 2.03l-4.4 4.42z' />
        </Svg>
        <Text style={{ fontSize: 10 }}>+92 333 9180410</Text>
      </View>
      <View style={{ fontWeight: '600', fontSize: 18, display: 'flex', alignItems: 'center', gap: 5, flexDirection: 'row' }}>
        <Svg viewBox='0 0 496 512' width="15" height="15">
          <Path fill='#0072bc' d='M336.5 160C322 70.7 287.8 8 248 8s-74 62.7-88.5 152h177zM152 256c0 22.2 1.2 43.5 3.3 64h185.3c2.1-20.5 3.3-41.8 3.3-64s-1.2-43.5-3.3-64H155.3c-2.1 20.5-3.3 41.8-3.3 64zm324.7-96c-28.6-67.9-86.5-120.4-158-141.6 24.4 33.8 41.2 84.7 50 141.6h108zM177.2 18.4C105.8 39.6 47.8 92.1 19.3 160h108c8.7-56.9 25.5-107.8 49.9-141.6zM487.4 192H372.7c2.1 21 3.3 42.5 3.3 64s-1.2 43-3.3 64h114.6c5.5-20.5 8.6-41.8 8.6-64s-3.1-43.5-8.5-64zM120 256c0-21.5 1.2-43 3.3-64H8.6C3.2 212.5 0 233.8 0 256s3.2 43.5 8.6 64h114.6c-2-21-3.2-42.5-3.2-64zm39.5 96c14.5 89.3 48.7 152 88.5 152s74-62.7 88.5-152h-177zm159.3 141.6c71.4-21.2 129.4-73.7 158-141.6h-108c-8.8 56.9-25.6 107.8-50 141.6zM19.3 352c28.6 67.9 86.5 120.4 158 141.6-24.4-33.8-41.2-84.7-50-141.6h-108z' />
        </Svg>
        <Text style={{ fontSize: 10 }}>www.senfenglaserpk.com</Text>
      </View>
    </View >
  )
}



export default InvoicePDF;
