import QuoteCell from '../QuoteCell';
import styles from './index.module.scss'
import { useEffect, useRef, useState } from 'react';
import CurrentPrice from '../CurrentPrice';

interface OrderBookData {
  bids:string[][];
  asks:string[][];
  seqNum:number;
  prevSeqNum:number;
  type:'snapshot'|'delta';
  timestamp:number;
  symbol:string;
}

const OrderBook = () => {
  const websocketRef = useRef<WebSocket>()
  const [previousOrderBookData, setPreviousOrderBookData] = useState<OrderBookData>()
  const [orderBookData, setOrderBookData] = useState<OrderBookData>()
  const previosSellQuotes = previousOrderBookData?.asks.slice(0, 7) || []
  const previosBuyQuotes = previousOrderBookData?.bids.slice(0, 7) || []
  const sellQuotes = orderBookData?.asks.slice(0, 7) || []
  const buyQuotes = orderBookData?.bids.slice(0, 7) || []

  const getQuotesTotalList = (quotes:string[][], shouldReverse?:boolean) => {
    let list:number[] = []
    const cloneQuotes = [...quotes]
    cloneQuotes.sort((a, b) => !shouldReverse ? 0 : a[0] < b[0] ? -1 : 1).reduce((accumulator, currentValue) => {
      const sum = accumulator + Number(currentValue[1])
      list.push(sum)
      return sum
    }, 0);
    return list.sort((a, b) => !shouldReverse ? 0 : a > b ? -1 : 1)
  }

  const sellQuotesTotalList = getQuotesTotalList(sellQuotes, true)
  const buyQuotesTotalList = getQuotesTotalList(buyQuotes)
  const maxTotal = Math.max.apply(null, [...sellQuotesTotalList, ...buyQuotesTotalList])

  const handleNewQuotes = (prevQuotes:string[][], newQuotes:string[][]) => {
    const clonePrevQuotes = [...prevQuotes]
    newQuotes.forEach((quote) => {
      const samePriceQuoteIndex = clonePrevQuotes.findIndex((prevQuote) => prevQuote[0] === quote[0])
      if (samePriceQuoteIndex !== -1) {
        clonePrevQuotes.splice(samePriceQuoteIndex, 1)
      }
      clonePrevQuotes.push(quote)
    });
    return clonePrevQuotes.filter((ask) => Number(ask[1]) !== 0).sort((a, b) => a > b ? -1 : a < b ? 1 : 0)
  }

  const handleConnectWebSocket = () => {
    if (websocketRef.current) return
    const ws = new WebSocket('ws://ws.btse.com/ws/oss/futures');
    ws.onopen = () => {
      const subscribe = {
        "op": "subscribe",
        "args": [
          "update:BTCPFC"
        ]
      }
      ws.send(JSON.stringify(subscribe))
    }
    ws.onmessage = (message) => {
      const data = JSON.parse(message.data)
      if (data.topic !== "update:BTCPFC") return
      setOrderBookData((prev) => {
        if (!prev) return data.data
        if (websocketRef.current && prev.seqNum !== data.data.prevSeqNum) {
          websocketRef.current.close()
          handleConnectWebSocket()
          return undefined
        }
        setPreviousOrderBookData(prev)
        return {
          ...data.data,
          asks: handleNewQuotes(prev.asks, data.data.asks),
          bids: handleNewQuotes(prev.bids, data.data.bids)
        }
      })
    }
    websocketRef.current = ws
  }

  const sizeChange = (previousQuotes:string[][], quote:string[]):undefined|'increase'|'decrease' => {
    if (previousQuotes.length === 0) return
    const samePricePreviousQuote = previousQuotes.find((previuosQuote) => previuosQuote[0] === quote[0])
    if (!samePricePreviousQuote) return
    return Number(samePricePreviousQuote[1]) > Number(quote[1]) ? 'decrease' : Number(samePricePreviousQuote[1]) < Number(quote[1]) ? 'increase' : undefined
  }

  useEffect(() => {
    handleConnectWebSocket()
    return () => {
      websocketRef.current?.close()
    };
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.title}>Order Book</div>
      <div className={styles.head}>
        <p>Price(USD)</p>
        <p>Size</p>
        <p>Total</p>
      </div>
      <div className={styles.quotes}>
        {sellQuotes.map((quote, index) => (
          <QuoteCell
            key={`sell-${index}`}
            type='sell'
            price={Number(quote[0])}
            size={Number(quote[1])}
            total={sellQuotesTotalList[index]}
            maxTotal={maxTotal}
            isNewPrice={previosSellQuotes.length > 0 && !previosSellQuotes.find((previuosQuote) => previuosQuote[0] === quote[0])}
            sizeChange={sizeChange(previosSellQuotes, quote)}
          />
        ))}
        <CurrentPrice />
        {buyQuotes.map((quote, index) => (
          <QuoteCell
            key={`buy-${index}`}
            type='buy'
            price={Number(quote[0])}
            size={Number(quote[1])}
            total={buyQuotesTotalList[index]}
            maxTotal={maxTotal}
            isNewPrice={previosBuyQuotes.length > 0 && !previosBuyQuotes.find((previuosQuote) => previuosQuote[0] === quote[0])}
            sizeChange={sizeChange(previosBuyQuotes, quote)}
          />
        ))}
      </div>
    </div>
  )
}

export default OrderBook
