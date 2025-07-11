document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('employeeForm');
  const editId = localStorage.getItem('editId');

  function showError(targetEl, message) {
    const error = document.createElement('div');
    error.className = 'error-msg';
    error.textContent = message;

    // Prevent duplicates
    const existingError = targetEl.parentNode?.nextElementSibling;
    if (existingError?.classList.contains('error-msg')) existingError.remove();

    // Mark as invalid
    targetEl.classList.add('invalid');

    // Append error below the parent row
    const row = targetEl.closest('tr');
    if (row && row.nextElementSibling?.classList.contains('error-msg')) {
      // Already added
    } else if (row) {
      const errorRow = document.createElement('tr');
      const spacer = document.createElement('td');
      spacer.colSpan = 2;
      spacer.appendChild(error);
      errorRow.appendChild(spacer);
      row.after(errorRow);
    }
  }

  function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => el.parentNode?.parentNode?.remove());
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  }

  if (form) {
    if (editId) {
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

    form.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors();

      const name = document.getElementById('input-name');
      const gender = document.querySelector('input[name="gender"]:checked');
      const profile = document.querySelector('input[name="profile"]:checked');
      const departments = Array.from(document.querySelectorAll('input[name="department[]"]:checked')).map(d => d.value);
      const salary = document.getElementById('salary');
      const day = document.getElementById('start-day');
      const month = document.getElementById('start-month');
      const year = document.getElementById('start-year');
      const note = document.getElementById('notes');
      const startDate = `${day.value} ${month.value} ${year.value}`;

      let hasError = false;

      // Validate
      if (!name.value.trim()) {
        showError(name, 'Name is required');
        hasError = true;
      }

      if (!gender) {
        showError(document.getElementById('gender-section'), 'Please select gender');
        hasError = true;
      }

      if (!profile) {
        showError(document.getElementById('profile-section'), 'Please select a profile image');
        hasError = true;
      }

      if (departments.length === 0) {
        showError(document.getElementById('dept-section'), 'Please select at least one department');
        hasError = true;
      }

      if (salary.value === 'Select Salary') {
        showError(salary, 'Please select a salary');
        hasError = true;
      }

      if (day.value === 'Day' || month.value === 'Month' || year.value === 'Year') {
        showError(document.getElementById('Start Date'), 'Please select a complete start date');
        hasError = true;
      }

      if (!note.value.trim()) {
        showError(note, 'Note cannot be empty');
        hasError = true;
      }

      if (hasError) return;

      const employee = {
        name: name.value.trim(),
        gender: gender.value,
        profile: profile.value,
        departments,
        salary: salary.value,
        startDate,
        note: note.value.trim()
      };

      const url = editId
        ? `http://localhost:3000/employees/${editId}`
        : 'http://localhost:3000/employees';

      const method = editId ? 'PUT' : 'POST';

      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      })
        .then(res => {
          if (!res.ok) throw new Error("Error saving employee");
          localStorage.removeItem('editId');
          window.location.href = 'employeeDetails.html';
        })
        .catch(err => {
          console.error("Error during save:", err);
          alert('Error saving employee: ' + err.message);
        });
    });
  }

  // LIST PAGE
  const list = document.getElementById('employeeList');
  if (list) {
    fetch('http://localhost:3000/employees')
      .then(res => res.json())
      .then(employees => {
        list.innerHTML = employees.map(emp => `
          <tr>
            <td><img src="${emp.profile}" width="40" height="40" /></td>
            <td>${emp.name}</td>
            <td>${emp.gender}</td>
            <td>${emp.departments.map(d => `<span class="dept-tag">${d}</span>`).join(' ')}</td>
            <td>₹ ${emp.salary}</td>
            <td>${emp.startDate}</td>
            <td>
              <button onclick="editEmployee('${emp.id}')"><img src="../Assets/editButton.png" alt="Edit" /></button>
              <button onclick="deleteEmployee('${emp.id}')"><img src="../Assets/deleteButton.png" alt="Delete" /></button>
            </td>
          </tr>
        `).join('');
      })
      .catch(err => alert("Error fetching employees: " + err.message));
  }
});

window.editEmployee = function(id) {
  localStorage.setItem('editId', id);
  window.location.href = '/HTML_files/payrollForm.html';
};

window.deleteEmployee = function(id) {
  if (confirm("Are you sure you want to delete this employee?")) {
    fetch(`http://localhost:3000/employees/${id}`, { method: 'DELETE' })
      .then(() => window.location.reload())
      .catch(err => alert("Error deleting employee: " + err.message));
  }
};
