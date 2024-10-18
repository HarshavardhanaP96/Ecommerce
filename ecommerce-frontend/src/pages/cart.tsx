import { useEffect, useState } from "react";
import { VscError } from "react-icons/vsc";
import CartItems from "../components/cartItems";
import { Link } from "react-router-dom";

const cartItemsList = [
  {
    productId: "hdosjfskbhs",
    photo:
      "https://media-ik.croma.com/prod/https://media.croma.com/image/upload/v1690293464/Croma%20Assets/Computers%20Peripherals/Laptop/Images/273880_g6cpks.png?tr=w-360",
    name: "nks sldi",
    price: 3000,
    quantity: 4,
    stock: 15,
  },
];
const subtotal = 4000;
const tax = Math.round(subtotal * 0.18);
const shippingCharges = 200;
const discount = 400;
const total = subtotal + tax + shippingCharges - discount;

const Cart = () => {
  const [couponCode, setCouponCode] = useState<string>("");
  const [isValidCouponCode, setIsValidCouponCode] = useState<boolean>(false);

  useEffect(() => {
    const timeOutID = setTimeout(() => {
      if (Math.random() > 0.5) setIsValidCouponCode(true);
      else setIsValidCouponCode(false);
    }, 1000);

    return () => {
      clearTimeout(timeOutID);
      setIsValidCouponCode(false);
    };
  }, [couponCode]);

  return (
    <div className="cart">
      <main>
        {cartItemsList.length > 0 ? (
          cartItemsList.map((i, idx) => <CartItems key={idx} cartItem={i} />)
        ) : (
          <h1>NO Items Added</h1>
        )}
      </main>
      <aside>
        <p>Subtotal:₹{subtotal}</p>
        <p>Shipping Charges:₹{shippingCharges}</p>
        <p>tax:₹{tax}</p>
        <p>
          Discount:<em className="red">-₹{discount}</em>{" "}
        </p>
        <p>
          <b>Total: ₹{total}</b>
        </p>
        <input
          type="text"
          placeholder="Coupon Code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
        />

        {couponCode &&
          (isValidCouponCode ? (
            <span className="green">
              ₹{discount} off using the <code>{couponCode}</code>
            </span>
          ) : (
            <span className="red">
              Invalid Coupon <VscError />{" "}
            </span>
          ))}

        {cartItemsList.length > 0 && <Link to="/shipping">Check out</Link>}
      </aside>
    </div>
  );
};

export default Cart;
