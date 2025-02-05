"use client"
import { useEffect, useState, useRef } from 'react';
import { Box, Grid, Input, Button, Select, VStack, Text, Center, Flex, useBreakpointValue, Image, Badge, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Icon, Textarea, Wrap, WrapItem, Table, Thead, Th, Tr, Td, Tbody, IconButton, Spacer } from '@chakra-ui/react';
import axios from 'axios';
import TextInput from './TextInput';
import { FaGlobe, FaMinusCircle, FaPlus, FaPlusCircle, } from "react-icons/fa";
import { FaPhone } from 'react-icons/fa6'
import moment from 'moment';
import Loading from './Loading';
import InvoicePDF from './invoicePDF';
import { pdf } from '@react-pdf/renderer';



export default function POS() {
    const [loading, setLoading] = useState(true);
    // const [selectedItem, setSelectedItem] = useState({ label: "", value: "" });
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [stock, setStock] = useState([]);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [name, setName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [address, setAddress] = useState("");
    const [qty, setQty] = useState("");
    const [price, setPrice] = useState("");
    const isMobile = useBreakpointValue({ base: true, md: false });
    const [totalAmount, setTotalAmount] = useState(0)
    const pdfRef = useRef();
    const [other, setOther] = useState("")
    const [showOther, setShowOther] = useState(false)
    const [customers, setCustomers] = useState([])
    const [manager, setManager] = useState("")
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [search, setSearch] = useState('')
    const [nextInvoice, setNextInvoice] = useState(`${moment().format("YYYYMMDD")}-1`)
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showList, setShowList] = useState(false)
    const [customerLoading, setCustomerLoading] = useState(false)
    const [scale, setScale] = useState(1);

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

    const generatePDF = async () => {
        handleUpdateStock()
        const blob = await pdf(<InvoicePDF companyName={companyName} name={name} phoneNumber={phoneNumber} address={address} manager={manager} nextInvoice={nextInvoice} invoiceItems={invoiceItems} totalAmount={totalAmount} />).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 600000);
    };

    async function handleUpdateStock() {

        const modified = stock.filter((item) => item?.modified)

        axios.put("/api/pos/customer", {
            name: name,
            company: companyName,
            phone: phoneNumber,
            address: address,
        }).finally(() => {
            fetchDataCustomer()
        })

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

            }).then(() => {

            }).finally(() => {
                fetchData()
            })
        } else {
            clearAll()
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

    // const customChakraStyles = {
    //     control: (provided) => ({
    //         ...provided,
    //         borderColor: "blue",
    //     }),
    // };

    // const itemSelectProps = useChakraSelectProps({
    //     value: {
    //         value: selectedItem.label,
    //         label: selectedItem.label == "" ? "Select One" : selectedItem.label,
    //     },
    //     onChange: (e) => {
    //         setSelectedItem({ label: e.label, value: e.value });
    //         if (e.label === 'Other') {
    //             setShowOther(true)
    //         }
    //     },
    // });

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



    return (
        (loading || customerLoading) ?
            <Loading />
            :
            <Flex style={{ display: 'flex', flexDirection: 'column' }}>
                <Box style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: '#0072BC', color: 'white', }}>
                    <Text style={{ fontSize: 20, fontWeight: '700' }}>SENFENG POS</Text>
                </Box>
                <Grid templateColumns={isMobile ? "1fr" : "1fr 1fr"} minH="100vh" px={4} gap={4} >
                    {/*Left Side */}
                    <VStack
                        align="start"
                        spacing={2}
                        p={6}
                        borderWidth={1}
                        borderRadius="lg"
                        boxShadow="lg"
                        bg="gray.50"
                        w="100%"
                    >
                        <Box w={'100%'}>
                            <InputField onFocus={() => setShowList(true)} onBlur={() => setTimeout(() => {
                                setShowList(false)
                            }, 500)} title="Phone Number" value={phoneNumber} onChange={handlePhoneChange} />
                            {/* Show customer suggestions */}
                            {phoneNumber && showList &&
                                <VStack align={'flex-start'} maxH={'200px'} overflowY={'auto'} pos={'absolute'} zIndex={1} bg={'white'}>
                                    {filteredCustomers.length > 0 && (
                                        <Box style={{ border: "1px solid #ccc", padding: "5px", margin: "0" }}>

                                            {filteredCustomers.map((customer, index) => (
                                                <Box key={index} _hover={{ backgroundColor: '#EFF9FFFF', opacity: 0.7, cursor: 'pointer' }}>
                                                    <Text
                                                        onClick={() => handleSelectCustomer(customer)}
                                                        style={{ listStyle: "none", padding: "5px" }}
                                                    >
                                                        {customer.name} ({customer.phone})
                                                    </Text>
                                                </Box>
                                            ))}

                                        </Box>
                                    )}
                                </VStack>
                            }

                        </Box>
                        <InputField title="Name" value={name} onChange={(e) => setName(e.target.value)} />
                        <InputField title="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />

                        <Box w="100%">
                            <Text fontWeight="bold" fontSize="lg" mb={2}>Address</Text>
                            <Textarea
                                resize="none"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter Address"
                                borderColor="gray.300"
                                borderRadius="md"
                                _focus={{ borderColor: "blue.500" }}
                            />
                        </Box>

                        <InputField title="Manager" value={manager} onChange={(e) => setManager(e.target.value)} />

                        <Box w="100%" p={5} bg="gray.100" borderRadius="md" boxShadow="sm">
                            <Table variant="simple">
                                <Thead bg="blue.600">
                                    <Tr>
                                        {["Description", "Quantity", "Unit Price", "Amount"].map((header, index) => (
                                            <Th w={index === 0 && '300px'} key={index} color="white" textAlign="left">{header}</Th>
                                        ))}
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {invoiceItems.map((item, i) => (
                                        <Tr key={i} fontSize="sm">
                                            <Td p={1}>
                                                <Input

                                                    name="description"
                                                    value={item?.description}
                                                    onChange={(e) => handleChange(e, i)}
                                                    borderRadius="md"
                                                    borderColor="gray.300"
                                                    _focus={{ borderColor: "blue.500" }}
                                                />
                                            </Td>
                                            <Td p={1}>
                                                <Input name="qty" readOnly value={item?.qty} borderRadius="md" borderColor="gray.300" />
                                            </Td>
                                            <Td p={1}>
                                                <Input type='number' name="price" value={item?.price ? Number(item?.price) : ''}
                                                    onKeyDown={(e) => {

                                                        if (
                                                            !/^\d$/.test(e.key) &&
                                                            e.key !== 'Backspace' &&
                                                            e.key !== 'Delete' &&
                                                            e.key !== 'ArrowLeft' &&
                                                            e.key !== 'ArrowRight' &&
                                                            e.key !== 'Tab'
                                                        ) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    onChange={(e) => {
                                                        handleChange(e, i)
                                                    }} borderRadius="md" borderColor="gray.300" />
                                            </Td>
                                            <Td p={1}>
                                                <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                    <Input readOnly name="total" value={item?.total} borderRadius="md" borderColor="gray.300" />
                                                    {item?.type === 'other'
                                                        &&
                                                        <Icon onClick={() => handleRemove(i)} as={FaMinusCircle} _hover={{ cursor: 'pointer', opacity: 0.7 }} color={'red'} ml={2} boxSize={'20px'} />

                                                    }
                                                </div>
                                            </Td>

                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>

                            {/* Add New Item Button */}
                            <Box display="flex" justifyContent="center" mt={4}>
                                <IconButton
                                    onClick={onOpen}
                                    icon={<FaPlus />}
                                    aria-label="Add Item"
                                    bg="blue.500"
                                    color="white"
                                    borderRadius="full"
                                    _hover={{ bg: "blue.600" }}
                                />
                            </Box>
                        </Box>

                        {/* Total Amount Section */}
                        <Box w="100%" display="flex" justifyContent="flex-end">
                            <Box display="flex" w="300px" borderWidth={1} borderColor="gray.300" borderRadius="md" overflow="hidden">
                                <Box flex={1} bg="gray.200" p={3} fontWeight="bold" textAlign="center">
                                    Total Amount
                                </Box>
                                <Box flex={1} bg="white" p={3} fontWeight="bold" textAlign="center">
                                    {totalAmount ? new Intl.NumberFormat('en-US').format(totalAmount) + "/-" : "0/-"}
                                </Box>
                            </Box>
                        </Box>

                        {/* Print Invoice Button */}
                        <Button
                            isDisabled={invoiceItems.length === 0}
                            w="100%"
                            colorScheme="green"
                            size="lg"
                            onClick={() => {
                                setLoading(true)
                                setCustomerLoading(true)
                                generatePDF()

                            }}
                            _hover={{ bg: "green.600" }}
                        >
                            Print Invoice
                        </Button>
                    </VStack>

                    {/*Right Side */}

                    <Box position={{base : 'relative', md :'fixed'}}
                    width={{base : '100%', md :'60vw'}}
                        top={10}
                        right={0}
                        overflowY="auto"
                        marginTop={scale == 1 ? 0 : 5}
                        transform={isMobile ? "scale(1)" : `scale(${scale})`}
                        transformOrigin="top"
                        display="flex"
                        flexDir="column"
                        alignItems="center"
                        p="10px"
                        bg="#F1F7FFFF"
                        borderWidth={1}
                        borderRadius="lg"
                        shadow="md"
                        >
                        <Badge m={5}>Invoice Preview</Badge>
                        <div ref={pdfRef} style={{ width: '100%', paddingLeft: 20, paddingRight: 20, paddingBottom: 20, }}>
                            {/* Header */}
                            <Header />
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
                                                        <Text fontWeight={500}>{header}</Text></th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoiceItems.map((item, i) => (
                                                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f1f1f1" : "white", fontSize: 14, height: 30 }}>
                                                    <td style={{ border: '1px solid #D1D5DB', paddingLeft: 5, }}><Text>{i + 1}</Text></td>
                                                    <td style={{ border: '1px solid #D1D5DB', paddingLeft: 5, width: '400px', }}>
                                                        <div style={{ width: '100%', backgroundColor: 'transparent', border: 'none' }}>
                                                            <Text>{item?.description}</Text>
                                                        </div>
                                                    </td>
                                                    <td style={{ border: '1px solid #D1D5DB', paddingLeft: 5, }}>
                                                        <div style={{ width: '100%', backgroundColor: 'transparent', border: 'none' }}>
                                                            <Text>{item?.qty}</Text>
                                                        </div>
                                                    </td>
                                                    <td style={{ border: '1px solid #D1D5DB', paddingLeft: 5, }}>
                                                        <div style={{ width: '100%', backgroundColor: 'transparent', border: 'none' }}>
                                                            <Text>{item?.price}</Text>
                                                        </div>
                                                    </td>
                                                    <td style={{ border: '1px solid #D1D5DB', paddingLeft: 5, }}>
                                                        <div style={{ width: '100%', backgroundColor: 'transparent', border: 'none' }}>
                                                            <Text>{item?.total}</Text>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {invoiceItems.length <= 10 && [...Array(10 - invoiceItems.length)].map((_, i) => (
                                                <tr key={i} style={{ fontSize: 14, height: 30 }}>
                                                    <td className="border border-gray-300 " style={{ paddingLeft: 5, }}><Text>{i + invoiceItems.length + 1}</Text></td>
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
                                            <Text>Total Amount</Text>
                                        </div>
                                        <div style={{ flex: 1, height: '200px', backgroundColor: '#0072BC', color: 'white', paddingLeft: 10, height: 50, display: 'flex', alignItems: 'center', fontWeight: '600', borderLeft: '1px solid', borderColor: 'white' }}>
                                            <Text>{totalAmount && new Intl.NumberFormat('en-US').format(totalAmount)}/-</Text>
                                        </div>
                                    </div>
                                </div>

                                <BankDetail />

                                <Disclaimer />

                            </div>
                            <Footer />
                        </div>
                    </Box>
                   
                </Grid>

               

                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay />
                    <ModalContent maxW={'90vw'} h={'90vh'}>
                        <ModalHeader>Add Item</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody overflowY={'auto'}>
                            <VStack >
                                <Text alignSelf={'flex-start'} fontSize={18} fontWeight={700}>START ADDING YOUR ITEMS</Text>
                                <Input placeholder='Search items here' value={search} onChange={(e) => setSearch(e.target.value)} />
                                <Wrap gap={2}>
                                    {stock.filter((item) => item?.name?.toLowerCase().includes(search.toLowerCase())).map((item, index) => (

                                        item.name !== 'Other'
                                            ?
                                            <WrapItem key={index} >
                                                <Box onClick={() => {
                                                    if (item.name === 'Other') {
                                                        setShowOther(true)
                                                        setOther("")
                                                    }
                                                }} _hover={item.name === 'Other' && { cursor: 'pointer', opacity: 0.7 }} w={'300px'} borderWidth={1} borderRadius="lg" shadow="md" fontSize={13} display={'flex'} flexDir={'column'} p={5}>
                                                    <Text >{item.name}</Text>
                                                    <Text>In stock: {item.qty}</Text>
                                                    <Text>Price: {item.price}</Text>

                                                    <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                                        <Icon onClick={() => handleDecrease(item)} _hover={{ cursor: 'pointer', opacity: 0.7 }} as={FaMinusCircle} boxSize={'20px'} color={'red'} />
                                                        <Text> {invoiceItems.find((eachItem) => eachItem.id === item.id)?.qty}</Text>
                                                        <Icon onClick={() => handleIncrease(item)} _hover={{ cursor: 'pointer', opacity: 0.7 }} as={FaPlusCircle} boxSize={'20px'} color={'green'} />
                                                    </div>


                                                </Box>
                                            </WrapItem>
                                            :
                                            <WrapItem key={index} >
                                                <Box onClick={() => {
                                                    setShowOther(!showOther)
                                                    setOther("")
                                                    setQty("")
                                                    setPrice("")
                                                }} _hover={{ cursor: 'pointer', opacity: 0.7 }} w={'300px'} borderWidth={1} borderRadius="lg" shadow="md" display={'flex'} flexDir={'column'} p={10} alignItems={'center'} justifyContent={'center'} backgroundColor={showOther ? 'blue.100' : 'white'}>
                                                    <Text fontSize={18} fontWeight={'bold'}>Other</Text>

                                                </Box>
                                            </WrapItem>
                                    ))}
                                </Wrap>
                                {/* <Box gap={"5px"} width={"100%"}>
                                <Text style={{ fontWeight: "600", fontSize: "18" }}>Select Item</Text>
                                <SearchableSelect
                                    id='stock-id'
                                    useBasicStyles
                                    chakraStyles={customChakraStyles}
                                    colorScheme="blue"
                                    options={stock.map((item) => ({
                                        value: item.id,
                                        label: `${item.name}`,
                                    }))}
                                    {...itemSelectProps}
                                />
                            </Box> */}
                                {showOther &&
                                    <>
                                        <TextInput title={"Enter Item Name"} value={other} onChange={(e) => setOther(e.target.value)} />
                                        <Box gap={"5px"} width={"100%"}>
                                            <Text style={{ fontWeight: "600", fontSize: "18" }}>Enter Quantity</Text>
                                            <Input
                                                type="number"
                                                placeholder="Quantity"
                                                value={qty || ''}
                                                onChange={(e) => setQty(Number(e.target.value))}
                                            />

                                        </Box>

                                        <Box gap={"5px"} width={"100%"}>
                                            <Text style={{ fontWeight: "600", fontSize: "18" }}>Enter Price</Text>
                                            <Input
                                                type="number"
                                                placeholder="Enter Price"
                                                value={price || ''}
                                                onChange={(e) => setPrice(Number(e.target.value))}
                                            />
                                        </Box>
                                        <Button isDisabled={!other || !qty || !price || qty === 0 || price === 0} colorScheme='blue' marginTop={2} alignSelf={'flex-start'} onClick={handleAddToInvoice}>
                                            Add
                                        </Button>
                                    </>

                                }


                            </VStack>
                        </ModalBody>

                        <ModalFooter>
                            <Button variant='outline' mr={3} onClick={onClose}>
                                Close
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Flex>

    );
}

const InputField = ({ title, value, onChange, onBlur, onFocus }) => (
    <Box w="100%">
        <Text fontWeight="bold" fontSize="md" mb={1}>{title}</Text>
        <Input
            onFocus={onFocus}
            onBlur={onBlur}
            value={value}
            onChange={onChange}
            borderColor="gray.300"
            borderRadius="md"
            _focus={{ borderColor: "blue.500" }}
        />
    </Box>
);

const BankDetail = () => {

    return (
        <div className="mb-8">
            <table className="w-full border-collapse">
                <tbody style={{ fontSize: 14 }}>
                    <tr style={{ height: 40 }}>
                        <td className="border border-gray-300 w-50" style={{ paddingLeft: 5 }}><Text>Bank</Text></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300"><Text>United Bank Limited (UBL)</Text></td>
                    </tr>
                    <tr className="bg-[#FFE4E1]" style={{ height: 40 }}>
                        <td className="border border-gray-300"><Text style={{ paddingLeft: 5 }}>Account Title</Text></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Text>SENFENG PAKISTAN</Text></td>
                    </tr>
                    <tr style={{ height: 40 }}>
                        <td className="border border-gray-300"><Text style={{ paddingLeft: 5 }}>Account Number</Text></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Text>321618245</Text></td>
                    </tr>
                    <tr className="bg-[#FFE4E1]" style={{ height: 40 }}>
                        <td className="border border-gray-300"><Text style={{ paddingLeft: 5 }}>IBAN</Text></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Text>PK33UNIL0109000321618245</Text></td>
                    </tr>
                    <tr style={{ height: 40 }}>
                        <td className="border border-gray-300"><Text style={{ paddingLeft: 5 }}>Branch Code</Text></td>
                        <td style={{ color: '#0072BC', fontWeight: '700', paddingLeft: 5 }} className="border border-gray-300 "><Text>0508</Text></td>
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
                        <Text>
                            {index == 0 ? companyName : index == 1 ? name : index == 2 ? phoneNumber : index == 3 ? address : index == 4 ? manager : index == 5 ? inv : ""}
                        </Text>
                    </div>

                </div>
            ))}
        </div>
    )
}

const CompanyDetails = () => {

    return (
        <div style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', }}>
            <div style={{ marginRight: 10, gap: 0, fontWeight: '600', fontSize: '14px', }}>
                <Text style={{ color: '#0072BC', fontSize: 18, fontWeight: '700' }} mb={0} mt={0}>SENFENG PAKISTAN</Text>
                <Text style={{ color: '#7F7F7FFF', }} mb={0} mt={0}>Street# 2, Sharif Garden Daroghawala,</Text>
                <Text style={{ color: '#7F7F7FFF', }} mb={0} mt={0}>Lahore, Punjab 54000, Pakistan</Text>
                <Text style={{ color: '#7F7F7FFF', }} mb={0} mt={0}>senfenglaserpakistan@gmail.com</Text>
            </div>
        </div>
    )
}

const Header = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', }}>
            {/* <Text fontSize={60} color={'#0072BC'} fontWeight={'800'}>SENFENG</Text> */}
            <Image src={"/logo.png"} alt="My Local Image" style={{ height: '50px', width: '250px' }} />
            <Box style={{ backgroundColor: '#0072BC', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginRight: 70, width: '250px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                <Text style={{ fontSize: '30px', fontWeight: '600', color: 'white', }}>
                    INVOICE
                </Text>
            </Box>
        </div>
    )
}

const Disclaimer = () => {
    return (
        <div className="text-center text-gray-500 text-sm" style={{ color: '#0072BC', fontWeight: '600' }}>
            <Text>DISCLAIMER: This is an auto generated Invoice and does not require a signature.</Text>
        </div>
    )
}

const Footer = () => {
    return (
        < div style={{ paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0072BC', marginLeft: 20 }} >
            <div style={{ fontWeight: '600', fontSize: 18, display: 'flex', alignItems: 'center', gap: 5 }}>
                <FaPhone size={'25px'} />
                <Text>+92 333 9180410</Text>
            </div>
            <div style={{ marginRight: 20, fontWeight: '600', fontSize: 18, display: 'flex', alignItems: 'center', gap: 5 }}>
                <FaGlobe size={'25px'} />
                <Text>www.senfenglaserpk.com</Text>
            </div>
        </div >
    )
}

