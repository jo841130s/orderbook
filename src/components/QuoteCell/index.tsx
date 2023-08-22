import styles from './index.module.scss'

interface Props {
  price:number;
  size:number;
  total:number;
  type: 'buy'|'sell';
  maxTotal:number;
  isNewPrice:boolean;
  sizeChange?:'increase'|'decrease';
}

const QuoteCell = ({ price, size, total, type, maxTotal, isNewPrice, sizeChange }:Props) => {
  return (
    <div className={`${styles.container} ${type === 'buy' ? styles.buy : styles.sell} ${isNewPrice && (type === 'buy' ? styles.newBuy : styles.newSell)}`}>
      <div className={styles.box}>
        <div className={styles.text}>
          <p>{price.toLocaleString("en-US")}</p>
        </div>
        <div className={`${styles.text} ${sizeChange && (sizeChange === 'decrease' ? styles.decrease : styles.increase)}`}>
          <p>{size.toLocaleString("en-US")}</p>
        </div>
        <div className={styles.text}>
          <p>{total.toLocaleString("en-US")}</p>
          <div className={styles.percentage} style={{ width: `${(total / maxTotal) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

export default QuoteCell
