import dynamic from 'next/dynamic'

const NoSSR = props => <>{props.children}</>

export default dynamic(() => Promise.resolve(NoSSR), { ssr: false })
