"use client"
import { Center, Spinner } from "@chakra-ui/react";


const Loading = () => {
    return (
        <Center w={'100vw'} height={'100vh'}>
            <Spinner />
        </Center>
    )
}

export default Loading