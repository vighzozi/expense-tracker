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

async function loadExpense(){
    const url = "/expenses";
    const response = await fetch(url);
    const json = await response.json();

    const table = document.getElementById("table");

    table.innerHTML = "";

    const header = `
      <thead>
        <tr>
          <th>Seller</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody id="table-body"></tbody>
    `;
    table.innerHTML = header;

    const body = document.getElementById("table-body");

    json.expenses.forEach(expenses => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${expenses.seller}</td>
          <td>${expenses.category}</td>
          <td>${expenses.amount}</td>
          <td>${new Date(expenses.created_at).toLocaleString()}</td>
          <td><button onclick="deleteExpense(${expenses.id})">🗑️</button></td>
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


window.onload = () => {
    loadExpense();
  };
  