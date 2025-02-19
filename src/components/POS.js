"use client"
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaGlobe, FaMinusCircle, FaPlus, } from "react-icons/fa";
import { FaPhone } from 'react-icons/fa6'
import moment from 'moment';
import InvoicePDF from './invoicePDF';
import { pdf } from '@react-pdf/renderer';
import PageContainer from './page-container';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ArrowUpDown, Copy, Loader2, Minus, PencilIcon, Plus } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import Dropzone from './dropzone';
import { storage } from '@/config/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import './Button.css'
import PageTable from './app-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import 'pdfjs-dist/legacy/web/pdf_viewer.css';
import { pdfjs } from 'react-pdf';
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
// pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;





export default function POS() {
    const [loading, setLoading] = useState(true);
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [stock, setStock] = useState([]);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [name, setName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [address, setAddress] = useState("");
    const [qty, setQty] = useState("");
    const [price, setPrice] = useState("");
    const [totalAmount, setTotalAmount] = useState(0)
    const pdfRef = useRef();
    const [other, setOther] = useState("")
    const [showOther, setShowOther] = useState(false)
    const [customers, setCustomers] = useState([])
    const [manager, setManager] = useState("")
    const [search, setSearch] = useState('')
    const [nextInvoice, setNextInvoice] = useState(`${moment().format("YYYYMMDD")}-1`)
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showList, setShowList] = useState(false)
    const [customerLoading, setCustomerLoading] = useState(false)
    const [scale, setScale] = useState(1);
    const [addProductVisible, setAddProductVisible] = useState(false)
    const [searchInvocie, setSearchInvoice] = useState(false)
    const [itemSearch, setItemSearch] = useState("")
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchModal, setSearchModal] = useState(false)
    const [searchItemsResult, setSearchItemsResult] = useState([])
    const [selectedSearchItem, setSelectedSearchItem] = useState(null)

    useEffect(() => {

        const handleResize = () => {
            const screenHeight = window.innerHeight;
            const boxHeight = 1500;
            const newScale = screenHeight / boxHeight;
            setScale(newScale < 1 ? newScale : 1);
        };

        handleResize(); // Call on mount
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleUpdateInvoice = async () => {
        handleInvoiceBackendData()
        const blob = await pdf(<InvoicePDF companyName={companyName} name={name} phoneNumber={phoneNumber} address={address} manager={manager} nextInvoice={nextInvoice} invoiceItems={invoiceItems} totalAmount={totalAmount} />).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 600000);
    }

    const handleInvoiceBackendData = async () => {

        axios.put("/api/pos/customer", {
            name: name,
            company: companyName,
            phone: phoneNumber,
            address: address,
        }).finally(() => {
            fetchDataCustomer()
        })

        axios.put(`/api/pos/update/${selectedSearchItem.id}`, {
            olditems: selectedSearchItem,
            newitems: { name: name, company: companyName, phone: phoneNumber, address: address, manager: manager, invoicenumber: nextInvoice, fields: invoiceItems }
        }).finally(() => {
            fetchData()
            setSelectedSearchItem(null)
            setSearchItemsResult([])

        })
    }

    const generatePDF = async () => {
        handleUpdateStock()
        const blob = await pdf(<InvoicePDF companyName={companyName} name={name} phoneNumber={phoneNumber} address={address} manager={manager} nextInvoice={nextInvoice} invoiceItems={invoiceItems} totalAmount={totalAmount} />).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 600000);
    };

    async function handleUpdateStock() {

        const modified = stock.filter((item) => item?.modified)

        if (modified.length > 0) {
            axios.put("/api/pos", {
                entries: modified,
                name: name,
                company: companyName,
                phone: phoneNumber,
                address: address,
                manager: manager,
                invoicenumber: nextInvoice,
                fields: invoiceItems,

            }).finally(() => {
                fetchData()
            })
        } else {
            fetchData()
        }

    }

    useEffect(() => {
        fetchData();
        fetchDataCustomer()
    }, []);

    const fetchData = async () => {
        clearAll()
        axios.get("/api/pos")
            .then((response) => {
                if (response.data.stock.length > 0) {
                    let resultedData = [...response.data.stock]
                    resultedData.push({ name: "Other", id: resultedData[resultedData.length - 1].id + 1 })
                    resultedData.push({ name: "Plus", id: resultedData[resultedData.length - 1].id + 2 })
                    setStock([...resultedData]);

                }
                if (response.data?.lastInventoryId) {
                    setNextInvoice(`${moment().format("YYYYMMDD")}-${response.data?.lastInventoryId + 1}`)
                }

            })
            .catch((e) => {
                console.log(e);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const fetchDataCustomer = async () => {
        axios.get("/api/pos/customer")
            .then((response) => {

                if (response.data.customers.length > 0) {
                    setCustomers(response.data.customers)
                }

            })
            .catch((e) => {
                console.log(e);
            })
            .finally(() => {
                setCustomerLoading(false);
            });
    };

    useEffect(() => {
        if (invoiceItems.length > 0) {
            let total = 0
            invoiceItems.forEach((item) => {
                total = total + Number(item.total)
            })
            setTotalAmount(total)
        } else {
            setTotalAmount(0)
        }
    }, [invoiceItems]);

    const handleAddToInvoice = () => {
        if (showOther) {
            setInvoiceItems((prev) => [
                ...prev,
                { total: price * qty, qty: qty, price: price, description: other || "", type: 'other' },
            ]);
            setOther("")
            setShowOther(false)

        }
        setShowOther(false)
        setQty("")
        setPrice('')
    };

    function handleChange(e, i) {
        const { value, name } = e.target;
        setInvoiceItems((prevItems) =>
            prevItems.map((item, index) =>
                index === i
                    ? {
                        ...item,
                        [name]: name === "price" ? value : value,
                        total: name === "price" ? Number(value) * Number(item.qty) : item.total,
                    }
                    : item
            )
        );
    }

    function handleIncrease(item) {
        if (item.qty < 1) return alert("Select a valid item and quantity.");

        setStock((prevStock) =>
            prevStock.map((eachItem) =>
                eachItem.id === item.id ? { ...eachItem, qty: eachItem.qty - 1, modified: true } : eachItem
            )
        );

        setInvoiceItems((prevItems) => {
            const existingItem = prevItems.find((eachItem) => eachItem.id === item.id);
            if (existingItem) {
                return prevItems.map((eachItem) =>
                    eachItem.id === item.id
                        ? { ...eachItem, qty: eachItem.qty + 1, total: eachItem.price * (eachItem.qty + 1) }
                        : eachItem
                );
            } else {
                return [...prevItems, { ...item, qty: 1, total: item.price, description: item.name }];
            }
        });
    }

    function handleDecrease(item) {
        const existing = invoiceItems.find((eachItem) => eachItem.id === item.id)
        if (!existing) return
        setInvoiceItems((prevItems) =>
            prevItems
                .map((eachItem) =>
                    eachItem.id === item.id
                        ? { ...eachItem, qty: eachItem.qty - 1, total: eachItem.price * (eachItem.qty - 1) }
                        : eachItem
                )
                .filter((eachItem) => eachItem.qty > 0)
        );

        setStock((prevStock) =>
            prevStock.map((eachItem) =>
                eachItem.id === item.id ? { ...eachItem, qty: eachItem.qty + 1, modified: true } : eachItem
            )
        );
    }

    function handleRemove(i) {
        setInvoiceItems((prevItems) =>
            prevItems.filter((_, ind) => ind !== i)
        );
    }

    function clearAll() {
        setInvoiceItems([]);
        setPhoneNumber("");
        setName("");
        setCompanyName("");
        setAddress("");
        setQty("");
        setPrice("");
        setTotalAmount(0)
        setOther("")
        setShowOther(false)
        setManager('')
        setSearch('')
        setNextInvoice("")
    }

    const handlePhoneChange = (e) => {
        const input = e.target.value;
        setPhoneNumber(input);
        const matches = customers.filter((customer) =>
            customer.phone.includes(input)
        );

        setFilteredCustomers(matches);
    };

    const handleSelectCustomer = (customer) => {
        setPhoneNumber(customer.phone)
        setName(customer.name)
        setCompanyName(customer.customer)
        setAddress(customer.address)
    };

    const captureAndCopyToClipboard = async () => {
        const blob = await pdf(
            <InvoicePDF
                companyName={companyName}
                name={name}
                phoneNumber={phoneNumber}
                address={address}
                manager={manager}
                nextInvoice={nextInvoice}
                invoiceItems={invoiceItems}
                totalAmount={totalAmount}
            />
        ).toBlob();

        // Convert PDF to PNG and Copy to Clipboard
        const arrayBuffer = await blob.arrayBuffer();
        const pdfData = new Uint8Array(arrayBuffer);

        const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const page = await pdfDoc.getPage(1);

        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        canvas.toBlob(async (blob) => {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            alert("Image copied to clipboard!");
        });
    };

    async function handleItemSearch() {
        axios.get(`/api/pos/search/${itemSearch}`)
            .then((response) => {
                if (response.data.length > 0) {
                    const resultWithTotal = response.data.map((item) => {
                        return { ...item, total: item.fields.reduce((acc, curr) => acc + Number(curr.total), 0) }
                    })
                    setSearchModal(true)
                    setSearchItemsResult(resultWithTotal)

                }

            }).catch((e) => {
                console.log(e)
            }).finally(() => {
                setSearchLoading(false)
            })
    }

    async function handleReset(){
        setLoading(true)
        setCustomerLoading(true)
        setSearchItemsResult([])
        setSelectedSearchItem(null)
        setItemSearch("")
        fetchData()
        fetchDataCustomer()
    }

    return (
        (loading || customerLoading) ?
            <div className='flex flex-1 w-full items-center justify-center h-[100vh]'>
                <Loader2 className="animate-spin" />
            </div>
            :
            <PageContainer scrollable={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div className='flex flex-1 p-2 flex-col p-6 border rounded-lg shadow-lg bg-gray-50 gap-4'>

                        <div className="w-full relative">
                            <Input
                                placeholder="Phone Number"
                                value={phoneNumber}
                                onFocus={() => setShowList(true)}
                                onBlur={() => setTimeout(() => setShowList(false), 500)}
                                onChange={(e) => {
                                    handlePhoneChange(e)
                                }}
                            />
                            {phoneNumber && showList && (
                                <div className="absolute z-10 max-h-[200px] overflow-auto bg-white border rounded-md shadow-md">
                                    {filteredCustomers.length > 0 && (
                                        <ul className="p-2">
                                            {filteredCustomers.map((customer, index) => (
                                                <li key={index} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => handleSelectCustomer(customer)}>
                                                    {customer.name} ({customer.phone})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                        <Input placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                        <div>
                            <p className="font-bold text-lg mb-2">Address</p>
                            <Textarea placeholder="Enter Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                        </div>
                        <Input placeholder="Manager" value={manager} onChange={(e) => setManager(e.target.value)} />
                        <Card className="p-5 bg-gray-100 rounded-md shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {["Description", "Quantity", "Unit Price", "Amount"].map((header, index) => (
                                            <TableHead key={index} className="text-left">{header}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoiceItems.map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <Input name="description" value={item?.description} onChange={(e) => { handleChange(e, i) }} />
                                            </TableCell>
                                            <TableCell>
                                                <Input readOnly value={item?.qty} />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" name="price" value={item?.price ? Number(item?.price) : ''}
                                                    onChange={(e) => {
                                                        if (!isNaN(e.target.value)) {
                                                            handleChange(e, i)
                                                        }
                                                    }} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 items-center">
                                                    <Input readOnly name="total" value={item?.total} />
                                                    {item?.type === "other" && <FaMinusCircle onClick={() => handleRemove(i)} className="text-red-500 cursor-pointer" />}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-center mt-4">
                                <AddItemDialog handleDecrease={handleDecrease} invoiceItems={invoiceItems} stock={stock} other={other} price={price} setOther={setOther} setPrice={setPrice} qty={qty} setQty={setQty} setShowOther={setShowOther} showOther={showOther} handleIncrease={handleIncrease} handleAddToInvoice={handleAddToInvoice}
                                    visible={addProductVisible}
                                    onClose={(val) => setAddProductVisible(val)}
                                    onRefresh={() => {
                                        setAddProductVisible(false)
                                        setStock([])
                                        fetchData()
                                    }} />
                            </div>
                        </Card>
                        <div className="flex justify-end w-full mt-4">
                            <div className="w-72 flex border rounded-md overflow-hidden">
                                <div className="flex-1 bg-gray-200 p-3 font-bold text-center">Total Amount</div>
                                <div className="flex-1 bg-white p-3 font-bold text-center">{totalAmount ? `${totalAmount}` : "0"}</div>
                            </div>
                        </div>
                        {selectedSearchItem ?
                            <Button
                                onClick={() => {
                                    setLoading(true)
                                    setCustomerLoading(true)
                                    handleUpdateInvoice()

                                }}
                                disabled={invoiceItems.length === 0}
                                className="w-full"
                            >

                                Update Invoice
                            </Button>
                            :
                            <Button
                                onClick={() => {
                                    setLoading(true)
                                    setCustomerLoading(true)
                                    generatePDF()

                                }}
                                disabled={invoiceItems.length === 0}
                                className="w-full"
                            >

                                Print Invoice
                            </Button>
                        }


                        <Button
                            onClick={() => {
                                setSearchInvoice(!searchInvocie)

                            }}
                            className="w-full"
                        >

                            Search Invoice
                        </Button>

                        {searchInvocie &&
                            <div className='flex w-full gap-4'>
                                <Input placeholder="Search by: invoice no, phone no, customer name, company name" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
                                <Button disabled={!itemSearch} onClick={() => {
                                    setSearchLoading(true)
                                    handleItemSearch()
                                }}>
                                    {searchLoading && <Loader2 className="animate-spin" />}
                                    Search
                                </Button>
                                {searchItemsResult.length > 0 && <Button variant="destructive" onClick={() => handleReset()}>Clear</Button>}

                            </div>}

                    </div>


                    <div className="flex flex-1 flex-col items-center p-2.5 bg-[#F1F7FF] border border-gray-300 rounded-lg shadow-md">

                        <div ref={pdfRef} style={{ width: '100%', paddingLeft: 20, paddingRight: 20, paddingBottom: 20, }}>
                            {/* Header */}
                            <Header onClick={() => captureAndCopyToClipboard()} />
                            <div style={{ padding: '5px', borderWidth: 2, borderColor: '#0072BC', borderRadius: 20, paddingTop: 20 }}>
                                {/* Company Details */}
                                <CompanyDetails />
                                {/* Form Fields */}
                                <FormField companyName={companyName} name={name} phoneNumber={phoneNumber} address={address} manager={manager} inv={nextInvoice} />
                                {/* Invoice Table */}
                                <div style={{ marginBottom: 5, width: '100%' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#0072BC', color: 'white', fontSize: 14 }}>
                                                {['Sr.', 'Description', 'Quantity', 'Unit Price', 'Amount'].map((header, index) => (
                                                    <th key={index} style={{ border: '1px solid #D1D5DB', padding: '0.5rem', textAlign: 'left' }}>
                                                        <Label style={{ fontWeight: 500 }}>{header}</Label></th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoiceItems.map((item, i) => (
                                                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f1f1f1" : "white", fontSize: 14, height: 30 }}>
                                                    <td style={{ border: '1px solid #D1D5DB', paddingLeft: 5, }}><Label>{i + 1}</Label></td>
                                                    <td style={{ border: '1px solid #D1D5DB', paddingLeft: 5, width: '400px', }}>
                                                        <div style={{ width: '100%', backgroundColor: 'transparent', border: 'none' }}>
                                                            <Label>{item?.description}</Label>
                                                        </div>
                                                    </td>
                                                    <td style={{ border: '1px solid #D1D5DB', paddingLeft: 5, }}>
                                                        <div style={{ width: '100%', backgroundColor: 'transparent', border: 'none' }}>
                                                            <Label>{item?.qty}</Label>
                                                        </div>
                                                    </td>
                                                    <td style={{ border: '1px solid #D1D5DB', paddingLeft: 5, }}>
                                                        <div style={{ width: '100%', backgroundColor: 'transparent', border: 'none' }}>
                                                            <Label>{item?.price}</Label>
                                                        </div>
                                                    </td>
                                                    <td style={{ border: '1px solid #D1D5DB', paddingLeft: 5, }}>
                                                        <div style={{ width: '100%', backgroundColor: 'transparent', border: 'none' }}>
                                                            <Label>{item?.total}</Label>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {invoiceItems.length <= 10 && [...Array(10 - invoiceItems.length)].map((_, i) => (
                                                <tr key={i} style={{ fontSize: 14, height: 30 }}>
                                                    <td className="border border-gray-300 " style={{ paddingLeft: 5, }}><Label>{i + invoiceItems.length + 1}</Label></td>
                                                    <td className="border border-gray-300 " style={{ paddingLeft: 5, }}>

                                                    </td>
                                                    <td className="border border-gray-300 ">

                                                    </td>
                                                    <td className="border border-gray-300">

                                                    </td>
                                                    <td className="border border-gray-300 ">

                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Total Amount */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
                                    <div style={{ width: '300px', display: 'flex', }}>
                                        <div style={{ flex: 1, height: '200px', backgroundColor: '#0072BC', color: 'white', paddingLeft: 5, height: 50, display: 'flex', alignItems: 'center', fontWeight: '600' }}>
                                            <Label>Total Amount</Label>
                                        </div>
                                        <div style={{ flex: 1, height: '200px', backgroundColor: '#0072BC', color: 'white', paddingLeft: 10, height: 50, display: 'flex', alignItems: 'center', fontWeight: '600', borderLeft: '1px solid', borderColor: 'white' }}>
                                            <Label>{totalAmount && new Intl.NumberFormat('en-US').format(totalAmount)}/-</Label>
                                        </div>
                                    </div>
                                </div>

                                <BankDetail />

                                <Disclaimer />

                            </div>
                            <Footer />
                        </div>
                    </div>
                    <SearchResultModal visible={searchModal} onClose={setSearchModal} data={searchItemsResult} onselect={(val) => {
                        setSearchModal(false)
                        setSelectedSearchItem(val)
                        setPhoneNumber(val.phone)
                        setName(val.name)
                        setManager(val.manager)
                        setCompanyName(val.company)
                        setAddress(val.address)
                        setInvoiceItems(val.fields)
                        setNextInvoice(val.invoicenumber)
                    }} />
                </div>
            </PageContainer >
    )
}


const SearchResultModal = ({ visible, onClose, data, onselect }) => {

    const pageTableRef = useRef()
    const [value, setValue] = useState("")

    const columns = [
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Date
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <div>
                    {row.getValue("created_at")
                        ? new Date(row.getValue("created_at")).toLocaleDateString("en-GB")
                        : ""}
                </div>
            ),
        },
        {
            accessorKey: "invoicenumber",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Invoice No
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("invoicenumber")}</div>,
        },

        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Name
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("name")}</div>,
        },


        {
            accessorKey: "company",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Company
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("company")}</div>,
        },

        {
            accessorKey: "total",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Invoice Amount
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("total")}</div>,
        },

        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                return <Button onClick={() => onselect(row.original)}>Select</Button>;
            },
        },
    ];

    ;

    const tableHeader = [
        {
            value: "invoicenumber",
            label: "Invoice Number",
        },
        {
            value: "name",
            label: "Name",
        },
        {
            value: "company",
            label: "Company",
        },
        {
            value: "phone",
            label: "Phone Number",
        },
    ];

    function handleClear() {
        if (pageTableRef.current) {
            pageTableRef.current.handleClear();
            setValue("");
        }
    }

    return (
        <Dialog open={visible} onOpenChange={onClose}>

            <DialogContent className="max-w-[90vw] h-[90vh]">

                <DialogHeader className={"hidden"}>
                    <DialogTitle>Select Invoice
                    </DialogTitle>
                </DialogHeader>

                <PageTable
                    ref={pageTableRef}
                    columns={columns}
                    data={data}
                    totalItems={data.length}
                    searchItem={value.toLowerCase()}
                    searchName={value ? `Search ${value}...` : "Select filter first..."}
                    tableHeader={tableHeader}
                >
                    <div className=" flex justify-between">
                        <div className="flex gap-4">
                            <Select
                                onValueChange={(val) => {
                                    setValue(val);
                                }}
                                value={value}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select filter..." />
                                </SelectTrigger>
                                <SelectContent>

                                    {tableHeader.map((framework) => (
                                        <SelectItem
                                            key={framework.value}
                                            value={framework.value}
                                            onClick={() => {
                                                setValue(
                                                    framework.value === value ? "" : framework.value
                                                );
                                            }}
                                        >
                                            {framework.label}
                                        </SelectItem>
                                    ))}

                                </SelectContent>
                            </Select>

                            <Button
                                onClick={() => {
                                    handleClear();
                                }}
                            >
                                Clear
                            </Button>


                        </div>
                    </div>
                </PageTable>

            </DialogContent>
        </Dialog>
    );
}

const AddItemDialog = ({ visible, onClose, handleDecrease, showOther, setShowOther, stock, invoiceItems, price, setPrice, setQty, qty, other, setOther, handleIncrease, handleAddToInvoice, onRefresh, }) => {



    const [search, setSearch] = useState("")
    const [lowStockStatus, setLowStockStatus] = useState(false)
    const [clickedLowStock, setClickedLowStock] = useState(false)

    useEffect(() => {
        if (stock.length > 0) {
            const hasLowStock = stock.some(item =>
                item.threshold != null && item.threshold !== undefined && item.threshold <= item.qty
            );
            setLowStockStatus(hasLowStock)
        }
    }, [stock])

    function handleLowStock() {
        setClickedLowStock(!clickedLowStock)
    }

    return (
        <Dialog >
            <DialogTrigger>

                <div className="p-4 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-700">
                    <FaPlus />
                </div>

            </DialogTrigger>

            <DialogContent className="max-w-[90vw] h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Select Item
                    </DialogTitle>
                </DialogHeader>
                <div className='flex flex-1 justify-end gap-4'>
                    <Button onClick={() => {
                        if (lowStockStatus) {
                            handleLowStock()
                        }
                    }} variant="destructive" className={lowStockStatus && "blinking-button"}>Low Stock</Button>
                    <Button>Order Stock</Button>

                </div>
                <Input
                    placeholder="Search items here"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <ScrollArea>

                    <div className="flex flex-col gap-5 p-4">


                        <div className="flex flex-wrap gap-2 justify-center">
                            {stock.filter((item) => clickedLowStock ? item.threshold != null && item.threshold !== undefined && item.threshold <= item.qty : item).filter((item) => item?.name?.toLowerCase().includes(search.toLowerCase())).map((item, index) =>

                                <RenderStockItems key={index} item={item} index={index} invoiceItems={invoiceItems} handleDecrease={handleDecrease} handleIncrease={handleIncrease} showOther={showOther} setShowOther={setShowOther} setQty={setQty} setPrice={setPrice} setOther={setOther}
                                    visible={visible}
                                    onClose={onClose}
                                    onRefresh={onRefresh}
                                />

                            )}
                        </div>

                        {showOther && (
                            <>
                                <div className="w-full">
                                    <label className="font-semibold text-xl block">Enter Item Name</label>
                                    <Input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Enter name..." />
                                </div>
                                <div className="gap-2 w-full">
                                    <label className="font-semibold text-xl block">Enter Quantity</label>
                                    <Input
                                        type="number"
                                        placeholder="Quantity"
                                        value={qty || ''}
                                        onChange={(e) => setQty(Number(e.target.value))}
                                    />
                                </div>

                                <div className="gap-2 w-full">
                                    <label className="font-semibold text-xl block">Enter Price</label>
                                    <Input
                                        type="number"
                                        placeholder="Enter Price"
                                        value={price || ''}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                    />
                                </div>
                                <Button className="mt-2"
                                    disabled={!other || !qty || !price || qty === 0 || price === 0}
                                    onClick={handleAddToInvoice}
                                >
                                    Add
                                </Button>
                            </>
                        )}
                    </div>

                </ScrollArea>
                {/* 
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter> */}
            </DialogContent>
        </Dialog>
    );
}

const RenderStockItems = ({ item, index, invoiceItems, handleDecrease, handleIncrease, showOther, setShowOther, setPrice, setQty, setOther, visible, onClose, onRefresh }) => {
    const [localName, setLocalName] = useState("")
    const [localQty, setLocalQty] = useState("")
    const [localPrice, setLocalPrice] = useState("")
    const [localImage, setLocalImage] = useState(null)
    const [editable, setEditable] = useState(false)
    const [loading, setLoading] = useState(false)
    const [itemImg, setImg] = useState(null)
    const [threshold, setThreshold] = useState("")
    const [newOrder, setNewOrder] = useState("")


    useEffect(() => {
        async function getImage(refImage) {
            const starsRef = ref(storage, `products/${refImage}`);
            getDownloadURL(starsRef)
                .then((url) => {
                    setImg(url)
                })
                .catch((error) => {
                    switch (error.code) {
                        case 'storage/object-not-found':
                            // File doesn't exist
                            break;
                        case 'storage/unauthorized':
                            // User doesn't have permission to access the object
                            break;
                        case 'storage/canceled':
                            // User canceled the upload
                            break;

                        // ...

                        case 'storage/unknown':
                            // Unknown error occurred, inspect the server response
                            break;
                    }
                });
        }
        if (item.img) {
            getImage(item.img)
        }
    }, [])

    const uploadFiles = async (item, imgRef) => {
        let name = ""
        if (imgRef) {
            name = imgRef
        } else {
            name = new Date().getTime().toString() + ".png"
        }
        return new Promise((resolve, reject) => {
            const metadata = {
                contentType: "image/png",
            };
            const storageRef = ref(
                storage,
                `products/` + name
            );
            const uploadTask = uploadBytesResumable(storageRef, item, metadata);
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log("Upload is " + progress + "% done");
                    switch (snapshot.state) {
                        case "paused":
                            console.log("Upload is paused");
                            break;
                        case "running":
                            console.log("Upload is running");
                            break;
                    }
                },
                (error) => {
                    setLoading(false);
                    reject(null)
                },
                () => {
                    resolve(name)
                }
            );
        })

    };

    async function handleSave(id, imgRef) {

        setLoading(true)
        try {
            const result = await uploadFiles(localImage, imgRef)
            axios.put(`/api/pos/${id}`, {
                name: localName,
                price: localPrice,
                qty: localQty,
                image: result,
                threshold: threshold,
                new_order: newOrder
            })
                .then((response) => {
                    console.log(response.data)
                }).catch((e) => {
                    console.log(e)
                }).finally(() => {
                    setLoading(false)
                    onRefresh()

                })
        } catch (error) {
            console.log(error)
            setLoading(false)
        }

    }

    return (
        item.name === 'Other' ?
            <div key={index} className="w-[300px] border border-gray-300 rounded-lg shadow-md p-10 flex items-center justify-center"
                style={{ backgroundColor: showOther ? 'rgba(0, 114, 188, 0.1)' : 'white', cursor: 'pointer' }}
                onClick={() => {
                    setShowOther(!showOther);
                    setOther('');
                    setQty('');
                    setPrice('');
                }}
            >
                <p className="font-bold text-xl">Other</p>
            </div>
            : item.name === 'Plus'
                ?
                <AddNewProduct visible={visible} onClose={onClose} onRefresh={onRefresh} />
                :
                (
                    <div className={`w-[300px] border border-gray-300 rounded-lg shadow-md p-5 flex flex-col ${invoiceItems.find((eachItem) => eachItem.id === item.id)?.qty > 0 && "bg-blue-100"}`}>
                        {!editable ?
                            <div className='flex flex-1 flex-col'>
                                {itemImg && <img src={itemImg} className='w-[250px]' />}
                                <p>{item.name}</p>
                                <p>In stock: {item.qty}</p>
                                <p>Price: {item.price}</p>
                            </div>
                            :
                            <div className='space-y-2 flex flex-1 flex-col'>
                                <Dropzone
                                    value={localImage ? URL.createObjectURL(localImage) : null}
                                    onDrop={(file) => {
                                        setLocalImage(file)
                                    }}
                                    title="Click to upload"
                                    subheading="or drag and drop"
                                    description="PNG or JPG"
                                    drag="Drop the files here..."
                                />

                                <input placeholder={item?.name} style={{ borderWidth: 1, borderColor: '#cccccc', fontSize: '14px' }} className='px-2' value={localName} onChange={(e) => setLocalName(e.target.value)} />

                                <div className='flex justify-between'>

                                    <div className='text-[14px]'>Quantity</div>

                                    <input placeholder={item?.qty || "Enter qty"} style={{ borderWidth: 1, borderColor: '#cccccc', fontSize: '14px', width: '50%', }} type="number" value={localQty || ""} className='px-2 ' onChange={(e) => {
                                        if (!isNaN(e.target.value)) {
                                            setLocalQty(Number(e.target.value))
                                        }

                                    }} />
                                </div>

                                <div className='flex justify-between'>

                                    <div className='text-[14px]'>Price</div>
                                    <input placeholder={item?.price || "Enter price"} style={{ borderWidth: 1, borderColor: '#cccccc', fontSize: '14px', width: '50%', }} type="number" value={localPrice || ""} className='px-2 ' onChange={(e) => {
                                        if (!isNaN(e.target.value)) {
                                            setLocalPrice(Number(e.target.value))
                                        }

                                    }} />
                                </div>
                                <div className='flex justify-between'>
                                    <div className='text-[14px]'>Threshold</div>
                                    <input type='number' placeholder={item?.threshold || "Enter threshold"} style={{ borderWidth: 1, borderColor: '#cccccc', fontSize: '14px', width: '50%', }} className='px-2 ' value={threshold || ""} onChange={(e) => {
                                        if (!isNaN(e.target.value)) {
                                            setThreshold(Number(e.target.value))
                                        }


                                    }} />
                                </div>
                                <div className='flex justify-between'>

                                    <div className='text-[14px]'>New order</div>
                                    <input type='number' placeholder={item?.threshold || "Enter new order"} style={{ borderWidth: 1, borderColor: '#cccccc', fontSize: '14px', width: '50%', }} className='px-2 ' value={newOrder || ""} onChange={(e) => {
                                        if (!isNaN(e.target.value)) {
                                            setNewOrder(Number(e.target.value))
                                        }


                                    }} />
                                </div>



                                <Button onClick={() => handleSave(item.id, item.img)}>
                                    {loading && <Loader2 className="animate-spin" />}
                                    Save</Button>
                            </div>
                        }

                        <div className='flex w-full justify-between items-center'>
                            <div className="flex gap-2 mt-2">
                                <div className='hover:cursor-pointer' style={{ opacity: editable ? 0.5 : 1 }} onClick={() => {
                                    if (!editable) {
                                        handleDecrease(item)
                                    }

                                }}>
                                    <Minus color="red" />
                                </div>

                                <p>{invoiceItems.find((eachItem) => eachItem.id === item.id)?.qty}</p>
                                <div className='hover:cursor-pointer' style={{ opacity: editable ? 0.5 : 1 }} onClick={() => {
                                    if (!editable) {
                                        handleIncrease(item)
                                    }
                                }}>
                                    <Plus color="green" />
                                </div>

                            </div>
                            <div className='hover:cursor-pointer' onClick={() => {
                                setLocalName(item.name)
                                setLocalQty(item?.qty || 0)
                                setLocalPrice(item?.price || 0)
                                setThreshold(item?.threshold || "")
                                setNewOrder(item?.new_order || "")
                                setEditable(!editable)
                            }}>
                                <PencilIcon className='h-4' />
                            </div>
                        </div>
                    </div>
                )
    )
}

const AddNewProduct = ({ visible, onClose, onRefresh }) => {
    const [name, setName] = useState("")
    const [qty, setQty] = useState("")
    const [price, setPrice] = useState("")
    const [image, setImage] = useState(null)
    const [threshold, setThreshold] = useState("")
    const [newOrder, setNewOrder] = useState("")
    const [loading, setLoading] = useState(false)


    const uploadFiles = async (item) => {
        return new Promise((resolve, reject) => {
            const name = new Date().getTime().toString() + ".png";
            const metadata = {
                contentType: "image/png",
            };
            const storageRef = ref(
                storage,
                `products/` + name
            );
            const uploadTask = uploadBytesResumable(storageRef, item, metadata);
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log("Upload is " + progress + "% done");
                    switch (snapshot.state) {
                        case "paused":
                            console.log("Upload is paused");
                            break;
                        case "running":
                            console.log("Upload is running");
                            break;
                    }
                },
                (error) => {
                    setLoading(false);
                    reject(null)
                },
                () => {
                    resolve(name)
                }
            );
        })

    };

    async function handleSaveProduct() {
        setLoading(true)
        try {
            const result = await uploadFiles(image)
            axios.post("/api/pos", {
                name: name,
                price: price,
                qty: qty,
                image: result,
                threshold: threshold,
                new_order: newOrder
            })
                .then((response) => {
                    console.log(response.data)
                }).catch((e) => {
                    console.log(e)
                }).finally(() => {
                    setLoading(false)
                    onRefresh()

                })
        } catch (error) {
            console.log(error)
            setLoading(false)
        }

    }
    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogTrigger asChild>
                <div className="w-[300px] border border-gray-300 rounded-lg shadow-md p-10 flex items-center justify-center"
                    style={{ backgroundColor: 'white', cursor: 'pointer' }}
                    onClick={() => {
                        setName("")
                        setPrice("")
                        setQty("")
                        setImage(null)
                    }}
                >
                    <Plus size={'80px'} />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add new customer</DialogTitle>
                </DialogHeader>
                <div>
                    <ScrollArea className="h-[80vh] px-2">
                        <div className="px-2">

                            <div className='text-md'>Name</div>
                            <Input placeholder="Enter product name" value={name} onChange={(e) => setName(e.target.value)} />
                            <div className='text-md mt-2'>Quantity</div>
                            <Input type="number" placeholder="Enter quantity" value={qty || ""} onChange={(e) => {
                                if (!isNaN(e.target.value))
                                    setQty(e.target.value)
                            }} />

                            <div className='text-md mt-2'>Price</div>
                            <Input type="number" placeholder="Enter price" value={price || ""} onChange={(e) => {
                                if (!isNaN(e.target.value))
                                    setPrice(e.target.value)
                            }} />

                            <div className='text-md mt-2'>Threshold</div>
                            <Input type="number" placeholder="Enter threshold" value={threshold || ""} onChange={(e) => {
                                if (!isNaN(e.target.value))
                                    setThreshold(e.target.value)
                            }} />

                            <div className='text-md mt-2'>New Order</div>
                            <Input type="number" placeholder="Enter new order" value={newOrder || ""} onChange={(e) => {
                                if (!isNaN(e.target.value))
                                    setNewOrder(e.target.value)
                            }} />

                            <div className='text-md mt-2'>Image URL</div>

                            <Dropzone
                                value={image ? URL.createObjectURL(image) : null}
                                onDrop={(file) => {
                                    setImage(file)
                                }}
                                title="Click to upload"
                                subheading="or drag and drop"
                                description="PNG or JPG"
                                drag="Drop the files here..."
                            />


                            <Button disabled={!image || !name || !price || !qty} className="w-full mt-2" onClick={handleSaveProduct}>
                                {loading && <Loader2 className="animate-spin" />}
                                Save</Button>
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const BankDetail = () => {

    return (
        <div className="mb-8">
            <table className="w-full border-collapse">
                <tbody style={{ fontSize: 14 }}>
                    <tr style={{ height: 40 }}>
                        <td className="border border-gray-300 w-50" style={{ paddingLeft: 5 }}><Label>Bank</Label></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300"><Label>United Bank Limited (UBL)</Label></td>
                    </tr>
                    <tr className="bg-[#FFE4E1]" style={{ height: 40 }}>
                        <td className="border border-gray-300"><Label style={{ paddingLeft: 5 }}>Account Title</Label></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Label>SENFENG PAKISTAN</Label></td>
                    </tr>
                    <tr style={{ height: 40 }}>
                        <td className="border border-gray-300"><Label style={{ paddingLeft: 5 }}>Account Number</Label></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Label>321618245</Label></td>
                    </tr>
                    <tr className="bg-[#FFE4E1]" style={{ height: 40 }}>
                        <td className="border border-gray-300"><Label style={{ paddingLeft: 5 }}>IBAN</Label></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Label>PK33UNIL0109000321618245</Label></td>
                    </tr>
                    <tr style={{ height: 40 }}>
                        <td className="border border-gray-300"><Label style={{ paddingLeft: 5 }}>Branch Code</Label></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Label>0508</Label></td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

const FormField = ({ phoneNumber, address, companyName, name, manager, inv }) => {
    return (
        <div style={{ display: 'grid', gap: 0, marginBottom: 5 }}>
            {['Company', 'Name', 'Contact', 'Address', 'Manager', 'Invoice No'].map((label, index) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ color: '#7F7F7FFF', marginLeft: 10, fontWeight: '600' }}>{label}:</label>
                    <div style={{ backgroundColor: '#dce4f1', paddingLeft: 10, border: '1px solid #E5E7EB', maxWidth: '600px', height: 30, fontSize: 18, display: 'flex', alignItems: 'center' }}>
                        <Label>
                            {index == 0 ? companyName : index == 1 ? name : index == 2 ? phoneNumber : index == 3 ? address : index == 4 ? manager : index == 5 ? inv : ""}
                        </Label>
                    </div>

                </div>
            ))}
        </div>
    )
}

const CompanyDetails = () => {
    return (
        <div className="flex flex-col items-end">
            <div className="mr-2 gap-0 font-semibold text-sm">
                <p className="text-[#0072BC] text-lg font-bold mb-0 mt-0">SENFENG PAKISTAN</p>
                <p className="text-[#7F7F7F] mb-0 mt-0">Street# 2, Sharif Garden Daroghawala,</p>
                <p className="text-[#7F7F7F] mb-0 mt-0">Lahore, Punjab 54000, Pakistan</p>
                <p className="text-[#7F7F7F] mb-0 mt-0">senfenglaserpakistan@gmail.com</p>
            </div>
        </div>
    );
};


const Header = ({ onClick }) => {
    return (
        <div className="flex justify-between items-end ">
            <img src="/logo.png" alt="My Local Image" className="h-12 w-[250px]" />
            <div className='flex  items-center mr-[-20px]'>
                <div className="bg-[#0072BC] rounded-tl-2xl rounded-tr-2xl  w-[250px] h-11 flex items-center justify-center">
                    <p className="text-2xl font-semibold text-white">
                        INVOICE
                    </p>
                </div>
                <Copy onClick={onClick} className='ml-4 hover:cursor-pointer' />
            </div>


        </div>
    );
};


const Disclaimer = () => {
    return (
        <div className="text-center text-gray-500 text-sm" style={{ color: '#0072BC', fontWeight: '600' }}>
            <Label>DISCLAIMER: This is an auto generated Invoice and does not require a signature.</Label>
        </div>
    )
}

const Footer = () => {
    return (
        < div style={{ paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0072BC', marginLeft: 20 }} >
            <div style={{ fontWeight: '600', fontSize: 18, display: 'flex', alignItems: 'center', gap: 5 }}>
                <FaPhone size={'25px'} />
                <Label>+92 333 9180410</Label>
            </div>
            <div style={{ marginRight: 20, fontWeight: '600', fontSize: 18, display: 'flex', alignItems: 'center', gap: 5 }}>
                <FaGlobe size={'25px'} />
                <Label>www.senfenglaserpk.com</Label>
            </div>
        </div >
    )
}

