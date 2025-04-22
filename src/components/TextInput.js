import { Box, Input, Text } from "@chakra-ui/react"


const TextInput = ({ title, value, onChange }) => {

    return (
        <Box gap={"5px"} width={"100%"}>
            <Text style={{fontWeight:'600', fontSize:'18'}}>{title}</Text>
            <Input placeholder={`Enter ${title}`} value={value} onChange={onChange} />
        </Box>
    )
}

export default TextInput