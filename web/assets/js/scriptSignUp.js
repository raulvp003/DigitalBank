document.addEventListener('DOMContentLoaded', function() {
    // ===== MOBILE MENU =====
    const navToggler = document.getElementById('navToggler');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggler && navMenu) {
        navToggler.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // ===== DARK MODE (ALTERNATE STYLESHEET) =====
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = darkModeToggle.querySelector('i');
    const darkModeCSS = document.getElementById('dark-mode-css');

    // Cargar preferencia guardada
    if (localStorage.getItem('darkMode') === 'enabled') {
        darkModeCSS.disabled = false;
        darkModeIcon.className = 'fas fa-sun';
    } else {
        darkModeCSS.disabled = true;
        darkModeIcon.className = 'fas fa-moon';
    }

    // Toggle con el botón
    darkModeToggle.addEventListener('click', () => {
        if (darkModeCSS.disabled) {
            darkModeCSS.disabled = false;
            localStorage.setItem('darkMode', 'enabled');
            darkModeIcon.className = 'fas fa-sun';
        } else {
            darkModeCSS.disabled = true;
            localStorage.setItem('darkMode', 'disabled');
            darkModeIcon.className = 'fas fa-moon';
        }
    });
    
    // ===== SHOW/HIDE PASSWORD =====
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', function() {
            const inputId = this.getAttribute('data-target');
            const input = document.getElementById(inputId);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
    
    // ===== FIELD VALIDATION ON BLUR =====
    function addBlurValidation(id, regex, errorMessage) {
        const field = document.getElementById(id);
        const errorEl = document.getElementById(id + 'Error');
        
        if (!field || !errorEl) return;
        
        field.addEventListener('blur', function() {
            const value = field.value.trim();
            
            // Hide message if the field is empty
            if (value === "") {
                errorEl.style.display = 'none';
                field.classList.remove('error');
                return;
            }
            
            // If the value does not match regex, show error
            if (!regex.test(value)) {
                errorEl.style.display = 'flex';
                field.classList.add('error');
            } else {
                errorEl.style.display = 'none';
                field.classList.remove('error');
            }
        });
        
        // Clear error when user starts typing
        field.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                field.classList.remove('error');
                errorEl.style.display = 'none';
            }
        });
    }
    
    // Adding validation for each field
    addBlurValidation("FirstName", /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{2,50}$/, "First name must contain only letters and spaces (2–50 characters)");
    addBlurValidation("MiddleInitial", /^[A-Za-zÁÉÍÓÚáéíóúñÑ]?$/, "Middle initial can only be one letter");
    addBlurValidation("LastName", /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{2,50}$/, "Last name must contain only letters and spaces (2–50 characters)");
    addBlurValidation("Street", /^[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s.,-]{2,90}$/, "Street can contain letters, numbers, and spaces (2–90 characters)");
    addBlurValidation("City", /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{2,50}$/, "City must contain only letters and spaces (2–50 characters)");
    addBlurValidation("State", /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{2,50}$/, "State must contain only letters and spaces (2–50 characters)");
    addBlurValidation("Zip", /^[0-9]{4,10}$/, "ZIP Code must contain between 4 and 10 digits");
    addBlurValidation("Phone", /^[0-9]{9,15}$/, "Phone number must contain between 9 and 15 digits");
    addBlurValidation("Email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email (example@domain.com)");
    addBlurValidation("Password", /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, "Password must have at least 8 characters, one uppercase letter, one number, and one symbol");
    
    // Password match validation
    const confirmPass = document.getElementById('ConfirmPassword');
    const password = document.getElementById('Password');
    
    if (confirmPass && password) {
        const confirmError = document.getElementById('ConfirmPasswordError');
        
        function validatePasswordMatch() {
            const passValue = password.value.trim();
            const confirmValue = confirmPass.value.trim();
            
            if (confirmValue === '') {
                confirmError.style.display = 'none';
                confirmPass.classList.remove('error');
                return;
            }
            
            if (passValue !== confirmValue) {
                confirmError.style.display = 'flex';
                confirmPass.classList.add('error');
            } else {
                confirmError.style.display = 'none';
                confirmPass.classList.remove('error');
            }
        }
        
        confirmPass.addEventListener('blur', validatePasswordMatch);
        confirmPass.addEventListener('input', validatePasswordMatch);
    }
    
    // ===== CUSTOMER CONSTRUCTOR =====
    function Customer(id, firstName, middleInitial, lastName, street, city, state, zip, phone, email, password) {
        this.id = id;
        this.firstName = firstName;
        this.middleInitial = middleInitial;
        this.lastName = lastName;
        this.street = street;
        this.city = city;
        this.state = state;
        this.zip = zip;
        this.phone = phone;
        this.email = email;
        this.password = password;
    }
    
    // Convert customer data into XML format
    Customer.prototype.toXML = function() {
        return `
        <customer>
            <id>${this.id}</id>
            <firstName>${this.firstName}</firstName>
            <middleInitial>${this.middleInitial}</middleInitial>
            <lastName>${this.lastName}</lastName>
            <street>${this.street}</street>
            <city>${this.city}</city>
            <state>${this.state}</state>
            <zip>${this.zip}</zip>
            <phone>${this.phone}</phone>
            <email>${this.email}</email>
            <password>${this.password}</password>
        </customer>`.trim();
    };
    
    // ===== SAVE EMAIL IN SESSION =====
    function guardarDatosSesion(email) {
        sessionStorage.setItem("email", email);
        console.log("Email stored in session: " + email);
    }
    
    // ===== HANDLE FORM SUBMISSION =====
    function handleSignUpOnClick(e) {
        e.preventDefault();
        const msgBox = document.getElementById("responseMsgSignUp");
        
        // Get values from all inputs
        const firstName = document.getElementById("FirstName").value.trim();
        const middleInitial = document.getElementById("MiddleInitial").value.trim();
        const lastName = document.getElementById("LastName").value.trim();
        const street = document.getElementById("Street").value.trim();
        const city = document.getElementById("City").value.trim();
        const state = document.getElementById("State").value.trim();
        const zip = document.getElementById("Zip").value.trim();
        const phone = document.getElementById("Phone").value.trim();
        const email = document.getElementById("Email").value.trim();
        const password = document.getElementById("Password").value.trim();
        const confirmPassword = document.getElementById("ConfirmPassword").value.trim();
        
        try {
            // Check that all fields are filled
            if (!firstName || !lastName || !street || !city || !state || !zip || !phone || !email || !password || !confirmPassword) {
                throw new Error("All fields must be completed.");
            }
            
            // Regex validation patterns
            const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{2,50}$/;
            const miRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ]{1}$/;
            const streetRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s.,-]{2,90}$/;
            const zipRegex = /^[0-9]{4,10}$/;
            const phoneRegex = /^[0-9]{9,15}$/;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
            
            // Validation for each field
            if (!nameRegex.test(firstName)) throw new Error("First name can only contain letters and spaces (2–50 characters).");
            if (middleInitial && !miRegex.test(middleInitial)) throw new Error("The middle initial can only be one letter.");
            if (!nameRegex.test(lastName)) throw new Error("Last name can only contain letters and spaces (2–50 characters).");
            if (!streetRegex.test(street)) throw new Error("Street can only contain letters, numbers, and spaces (2–90 characters).");
            if (!nameRegex.test(city)) throw new Error("City can only contain letters and spaces (2–50 characters).");
            if (!nameRegex.test(state)) throw new Error("State can only contain letters and spaces (2–50 characters).");
            if (!zipRegex.test(zip)) throw new Error("ZIP code must contain between 4 and 10 digits.");
            if (!phoneRegex.test(phone)) throw new Error("Phone number must contain between 9 and 15 digits.");
            if (!emailRegex.test(email)) throw new Error("Please enter a valid email address (example@domain.com).");
            if (!passRegex.test(password)) throw new Error("Password must be at least 8 characters, include one uppercase letter, one number, and one symbol.");
            if (password !== confirmPassword) throw new Error("Passwords do not match.");
            
            // Create new customer object
            const id = Date.now();
            const customer = new Customer(id, firstName, middleInitial, lastName, street, city, state, zip, phone, email, password);
            const xml = customer.toXML();
            sessionStorage.setItem("customer.id", customer.id);
            
            // For testing - save to localStorage
            localStorage.setItem('customer', JSON.stringify(customer));
            guardarDatosSesion(email);
            

         
        
            fetch("/CRUDBankServerSide/webresources/customer", {
                method: 'POST',
                headers: { 'Content-Type': 'application/xml' },
                body: xml
            })
            .then(response => {
                if (response.status === 403) throw new Error("That email is already in use.");
                if (response.status === 500) throw new Error("It was not possible to connect to the server.");
                if (!response.ok) throw new Error("An unexpected error occurred.");
                return response.text();
            })
            .then(text => {
                console.log("Server response:", text);
                guardarDatosSesion(email);
                
                msgBox.className = "alert-message alert-success";
                msgBox.textContent = '✅ User successfully registered ✅';
                msgBox.style.display = 'block';
                
                setTimeout(() => {
                    window.location.href = "signIn.html"; 
                }, 1000);
            })
            .catch(error => {
                console.error(error);
                msgBox.className = "alert-message alert-error";
                msgBox.textContent = '✖️ ' + error.message;
                msgBox.style.display = 'block';
            });
            
            
        } catch (error) {
            // Handle any local validation errors
            msgBox.className = "alert-message alert-error";
            msgBox.textContent = "✖️ " + error.message;
            msgBox.style.display = "block";
        }
    }
    
    // Event listener for form submission
    document.getElementById("signUpForm").addEventListener("submit", handleSignUpOnClick);
});