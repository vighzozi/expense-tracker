const expenseForm = document.getElementById("expense-form");

expenseForm.addEventListener("submit",handleFormSubmit);

async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const url = form.action;

    try {
        const formData = new FormData(form);
        const responseData = await postFormDataAsJson({url, formData});

        console.log({ responseData });
        console.log("Frissítem a táblát...");
        await loadExpense();
        form.reset();
    } catch (error) {
        console.error(error);
    }
}

async function postFormDataAsJson({ url, formData }) {
    const plainFormData = Object.fromEntries(formData.entries());
    const formDataJsonString = JSON.stringify(plainFormData);

    const fetchOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: formDataJsonString,
    };

    const response = await fetch(url, fetchOptions);

    if(!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
    
    return response.json();

}

async function loadExpense() {
    const url = "/expenses";
    const response = await fetch(url);
    const json = await response.json();
  
    // 1️⃣: Fejléc feltöltése
    const head = document.getElementById("table-head");
    head.innerHTML = `
      <tr>
        <th>Seller</th>
        <th>Category</th>
        <th>Amount</th>
        <th>Created At</th>
        <th>Actions</th>
      </tr>
    `;
  
    // 2️⃣: Sorok feltöltése
    const body = document.getElementById("table-body");
    body.innerHTML = "";
  
    json.expenses.reverse().forEach(expense => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${expense.seller}</td>
        <td>${expense.category}</td>
        <td>${expense.amount}</td>
        <td>${new Date(expense.created_at).toLocaleString()}</td>
        <td>
          <button onclick="editExpense(${expense.id})">✏️</button>
          <button onclick="deleteExpense(${expense.id})">🗑️</button>
        </td>
      `;
      body.appendChild(row);
    });
  }

async function deleteExpense(id) {
    const response = await fetch(`/expenses/${id}`, {
        method: "DELETE",
    });

    if (response.ok){
        console.log(`Deleted: ${id}`);
        await loadExpense();
    } else {
        console.log("Error, delete failed.");
    }
}

let currentEditId = null;
async function editExpense(expenses) {
    currentEditId = expenses.id;
    
    document.getElementById("edit-seller").value = expenses.seller;
    document.getElementById("edit-category").value = expenses.category;
    document.getElementById("edit-amount").value = expenses.amount;

    const modal = new bootstrap.Modal(document.getElementById('edit-modal'));
    modal.show();

}
async function submitEdit() {
    // 1. Összegyűjtjük az adatokat a mezőkből
    const seller = document.getElementById("edit-seller").value;
    const category = document.getElementById("edit-category").value;
    const amount = document.getElementById("edit-amount").value;
  
    // 2. Elküldjük őket PUT metódussal a Flask-nek
    const response = await fetch(`/expenses/${currentEditId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ seller, category, amount }),
    });
  
    // 3. Visszajelzés és táblázat újratöltése
    if (response.ok) {
      console.log(`Expense ${currentEditId} updated.`);
      await loadExpense(); // újratölti a táblázatot
  
      // 4. Modal bezárása
      const modalElement = document.getElementById('edit-modal');
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance.hide();
    } else {
      console.error("Failed to update.");
    }
  }
  
window.onload = () => {
    loadExpense();
  };
  