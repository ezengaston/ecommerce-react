import axios from "axios";
import { React } from "react";

export default function Product({ item, valid }) {
  async function createCheckoutSession() {
    try {
      const id = item.id;
      const response = await axios.post("/create-checkout-session", { id });
      return (window.location.href = response.data.url);
    } catch (e) {
      console.log(e);
    }
  }

  function checkIfPurchased(valid) {
    if (valid.valid && valid.listIds.find((id) => item.listId === id)) {
      return (
        <button className="btn download-btn">
          <a href={`http://localhost:1234/downloads/${item.id}`}>Download</a>
        </button>
      );
    } else {
      return (
        <button onClick={createCheckoutSession} className="btn purchase-btn">
          purchase
        </button>
      );
    }
  }

  return (
    <div className="item">
      <div className="item-name">{item.name}</div>
      <div className="item-footer">
        <div className="item-price">{`$${item.priceInCents / 100}`}</div>
        {checkIfPurchased(valid)}
      </div>
    </div>
  );
}
