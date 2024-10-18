import { Link } from 'react-router-dom'
import ProductCard from '../components/productCard'

const Home = () => {

  const addtoCartHandler=()=>{

  };

  return (
    <div className='home'>

      <section></section>
      
      <h1>Latest Product
        <Link to="/search" className='findmore'>
        More</Link>
      </h1>
      
      <main>
        <ProductCard 
          productId="djnksdnfsks" 
          name="Macbook" 
          price={155} 
          stock={14546} 
          handler={addtoCartHandler} 
          photo="https://media-ik.croma.com/prod/https://media.croma.com/image/upload/v1690293464/Croma%20Assets/Computers%20Peripherals/Laptop/Images/273880_g6cpks.png?tr=w-360"/>
      </main>
    
    </div>
  )
}

export default Home
