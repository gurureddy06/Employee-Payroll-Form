document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('employeeForm');
  const editId = localStorage.getItem('editId');

  // If on the form page
  if (form) {
    if (editId) {
      // Prefill form with employee data
      fetch(`http://localhost:3000/employees/${editId}`)
        .then(res => {
          if (!res.ok) {
            localStorage.removeItem('editId');
            throw new Error("Employee not found or has been deleted");
          }
          return res.json();
        })
        .then(emp => {
          document.getElementById('input-name').value = emp.name;
          document.querySelector(`input[name="gender"][value="${emp.gender}"]`).checked = true;
          document.querySelectorAll('input[name="department[]"]').forEach(cb => {
            if (emp.departments.includes(cb.value)) cb.checked = true;
          });
          document.getElementById('salary').value = emp.salary;

          const [day, month, year] = emp.startDate.split(" ");
          document.getElementById('start-day').value = day;
          document.getElementById('start-month').value = month;
          document.getElementById('start-year').value = year;

          document.getElementById('notes').value = emp.note || '';
          document.querySelector(`input[name="profile"][value="${emp.profile}"]`).checked = true;
        })
        .catch(err => alert("Error loading employee data: " + err.message));
    }

    // Handle form submission
    form.addEventListener('submit', e => {
      e.preventDefault();

      const name = document.getElementById('input-name').value;
      const gender = document.querySelector('input[name="gender"]:checked')?.value;
      const profile = document.querySelector('input[name="profile"]:checked')?.value;
      const departments = Array.from(document.querySelectorAll('input[name="department[]"]:checked')).map(d => d.value);
      const salary = document.getElementById('salary').value;
      const day = document.getElementById('start-day').value;
      const month = document.getElementById('start-month').value;
      const year = document.getElementById('start-year').value;
      const startDate = `${day} ${month} ${year}`;
      const note = document.getElementById('notes').value;

      if (!name || !gender || !profile || departments.length === 0 || salary === 'Select Salary' || day === 'Day' || month === 'Month' || year === 'Year' || !note) {
        alert("Please fill out all required fields.");
        return;
      }

      const employee = { name, gender, profile, departments, salary, startDate, note };

      const url = editId
        ? `http://localhost:3000/employees/${editId}`
        : 'http://localhost:3000/employees';

      fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      })
        .then(res => {
          if (!res.ok) throw new Error("Error saving employee");
          localStorage.removeItem('editId');
          // Use absolute path to avoid broken redirect
          window.location.href = 'employeeDetails.html';
        })
        .catch(err => {
          console.error("Error during save:", err);
          alert('Error saving employee: ' + err.message);
        });
    });
  }

  // If on the employee list page
  const list = document.getElementById('employeeList');
  if (list) {
    fetch('http://localhost:3000/employees')
      .then(res => res.json())
      .then(employees => {
        list.innerHTML = employees.map(emp => `
          <tr>
            <td><img src="${emp.profile}" width="40" height="40" class="profile-img" /></td>
            <td>${emp.name}</td>
            <td>${emp.gender}</td>
            <td>${emp.departments.map(d => `<span class="dept-tag">${d}</span>`).join(' ')}</td>
            <td>₹ ${emp.salary}</td>
            <td>${emp.startDate}</td>
            <td>
              <button onclick="editEmployee('${emp.id}')">
                <img src="../Assets/editButton.png" alt="Edit" />
              </button>
              <button onclick="deleteEmployee('${emp.id}')">
                <img src="../Assets/deleteButton.png" alt="Delete" />
              </button>
            </td>
          </tr>
        `).join('');
      })
      .catch(err => alert("Error fetching employees: " + err.message));
  }
});

// Global functions so inline onclick works
window.editEmployee = function(id) {
  localStorage.setItem('editId', id);
  window.location.href = '/HTML_files/payrollForm.html';
};

window.deleteEmployee = function(id) {
  if (confirm("Are you sure you want to delete this employee?")) {
    fetch(`http://localhost:3000/employees/${id}`, {
      method: 'DELETE'
    })
    .then(() => window.location.reload())
    .catch(err => alert("Error deleting employee: " + err.message));
  }
};
