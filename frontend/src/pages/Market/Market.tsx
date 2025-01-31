import { useEffect, useState } from 'react'
import "./Market.scss"
import MoreBar from '../../components/moreBar/moreBar'
import Navbar from '../../components/Navbar/Navbar'
import Tabbar from '../../components/Tabbar/Tabbar'
import more from '../../assets/more.png'
import close from '../../assets/close.png'
import schoolLogo from '../../assets/schoolLogo.png'

const Market = () => {
  let [marketType, setMarketType] = useState('sell');
  let [commodityType, setCommodityType] = useState('');
  let [showMore, setShowMore] = useState(false);


  return (
    <div className='market-container'>

      <div className='market-navbar'>   
        <Navbar />
        {/* <div className='logo'>
          <img src="logo.png" alt="" />
        </div>
        <div className='search'>
          <input type="text" placeholder="搜索" />
        </div>
        <div className='search-btn'>
          <img src="search.png" alt="" />
        </div> */}
      </div>
    

      <div className='market-body'>
        <div className='un-content'>   

          <div className='img'>
            <img src={schoolLogo} alt="schoolLogo" />
          </div>

          <div className='region'>
            
          </div>
          
          <div className='tag'>
              <div className='tag-item'>
                <div className='market-type'>
                  <div className='sell'>
                    <button onClick={() => setMarketType('sell')}>出</button>
                  </div>
                  <div className='buy'>
                    <button onClick={() => setMarketType('buy')}>收</button>
                  </div>
                </div>
                <div className='commodity-type'>
                  <div className='detail'>
                    <div>
                      <button onClick={() => setCommodityType('跑腿')}>跑腿</button>
                    </div>
                    <div>
                      <button onClick={() => setCommodityType('数码')}>数码</button>
                    </div>
                    <div>
                      <button onClick={() => setCommodityType('服饰')}>服饰</button>
                    </div>
                  </div>  
                </div>
              </div>
              <div className='more'>
                <img src="" alt="" />
                  <img src={showMore? close : more} alt="more" onClick={() => setShowMore(!showMore)}/>
                  {showMore && 
                  <div>
                    <MoreBar />
                  </div>
                  }
                </div>
            </div>

          <div className='price'>
            <div className='price-input'>

            </div>
          </div>



        </div>

        <div className='content'>    
          <div className='commodity'>
            <div className='commodity-img'>
              <img src="commodity.jpg" alt="" />
            </div>
            <div className='commodity-title'>
              c语言教材
            </div>
            <div className='commodity-bottom'>
              <div className='commodity-price'>
                ￥5
              </div>
              <div className='commodity-tag'>
                学习
              </div>
            </div>      
          </div>

          <div className='commodity'>
            <div className='commodity-img'>
              <img src="commodity.jpg" alt="" />
            </div>
            <div className='commodity-title'>
              c语言教材
            </div>
            <div className='commodity-bottom'>
              <div className='commodity-price'>
                ￥5
              </div>
              <div className='commodity-tag'>
                学习
              </div>
            </div>      
          </div><div className='commodity'>
            <div className='commodity-img'>
              <img src="commodity.jpg" alt="" />
            </div>
            <div className='commodity-title'>
              c语言教材
            </div>
            <div className='commodity-bottom'>
              <div className='commodity-price'>
                ￥5
              </div>
              <div className='commodity-tag'>
                学习
              </div>
            </div>      
          </div><div className='commodity'>
            <div className='commodity-img'>
              <img src="commodity.jpg" alt="" />
            </div>
            <div className='commodity-title'>
              c语言教材
            </div>
            <div className='commodity-bottom'>
              <div className='commodity-price'>
                ￥5
              </div>
              <div className='commodity-tag'>
                学习
              </div>
            </div>      
          </div>

          <div className='commodity'>
            <div className='commodity-img'>
              <img src="commodity.jpg" alt="" />
            </div>
            <div className='commodity-title'>
              c语言教材
            </div>
            <div className='commodity-bottom'>
              <div className='commodity-price'>
                ￥5
              </div>
              <div className='commodity-tag'>
                学习
              </div>
            </div>      
          </div>
        </div>
      </div>


       <div className='market-tabbar'>   
          <Tabbar />
       </div>

    </div>
  )
}

export default Market
