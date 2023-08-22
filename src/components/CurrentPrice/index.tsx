import { useEffect, useState } from "react"
import styles from './index.module.scss'
import { ReactComponent as Arrow } from '../../images/arrow.svg'

const CurrentPrice = () => {
  const [previousPrice, setPreviosPrice] = useState<number>()
  const [currentPrice, setCurrentPrice] = useState<number>()

  useEffect(() => {
    const ws = new WebSocket('wss://ws.btse.com/ws/futures');
    ws.onopen = () => {
      const subscribe = {
        "op": "subscribe",
        "args": [
          "tradeHistoryApi:BTCPFC"
        ]
      }
      ws.send(JSON.stringify(subscribe))
    }
    ws.onmessage = (message) => {
      const data = JSON.parse(message.data)
      if (data.topic !== "tradeHistoryApi") return
      const newPrice = data.data[0].price
      setCurrentPrice((prev) => {
        if (prev) setPreviosPrice(prev)
        return newPrice
      })
    }
    return () => {
      ws.close()
    };
  }, [])

  return (
    <div className={`${styles.currentPrice} ${(!previousPrice || !currentPrice || previousPrice === currentPrice) ? styles.same : currentPrice > previousPrice ? styles.up : styles.down}`}>
      {currentPrice?.toLocaleString("en-US") || 0}<Arrow />
    </div>
  )
}

export default CurrentPrice
