// Toggle password visibility for a given input field and change the eye icon accordingly
function EyeSwap(inputId, iconId) {
    const input = document.getElementById(inputId); // Get the password input element
    const icon = document.getElementById(iconId); // Get the eye icon element

    if (input.type === "password") { // If currently hidden
        input.type = "text"; // Show the password
        icon.src = "https://cdn-icons-png.flaticon.com/128/565/565655.png"; // Change icon to "open eye"
    } else { // If currently visible
        input.type = "password"; // Hide the password
        icon.src = "https://cdn-icons-png.flaticon.com/128/159/159604.png"; // Change icon to "closed eye"
    }
}

// Handle the "Change Password" button click
function BOnClick(event) {
    event.preventDefault(); // Prevent form from submitting normally
    event.stopPropagation(); // Stop event bubbling

    const oldPass = document.getElementById("oldPassword"); // Current password input
    const newPass = document.getElementById("nuevaPassword"); // New password input
    const confPass = document.getElementById("confirmPassword"); // Confirm new password input
    const msgBox = document.getElementById("cAlerta"); // Alert box
    const titulo = document.getElementById("titulo"); // Page title

    try {
        // Basic validation: all fields must be filled
        if (oldPass.value.trim() === "" || newPass.value.trim() === "" || confPass.value.trim() === "")
            throw new Error("All fields must be completed.");

        // Password length validation
        if (newPass.value.length > 255)
            throw new Error("The new password cannot exceed 255 characters.");
        if (newPass.value.length < 8)
            throw new Error("The new password must be at least 8 characters long.");

        // Regex to enforce at least 1 uppercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(newPass.value))
            throw new Error("Password must have at least 8 characters, one uppercase letter, one number, and one symbol.");

        // Check that the new password and confirmation match
        if (newPass.value !== confPass.value)
            throw new Error("The new passwords do not match.");

        // All validations passed: proceed to fetch current password and update
        fetchAndUpdatePassword(oldPass.value.trim(), newPass.value.trim());

    } catch (error) {
        // Display error message in red
        msgBox.textContent = '✖️ ' + error.message + ' ✖️';
        msgBox.style.display = 'block';
        msgBox.style.backgroundColor = 'red';
        titulo.style.backgroundColor = 'red';
    }
}

// Fetch current user info, validate old password, and update with new password
function fetchAndUpdatePassword(oldPassword, newPassword) {
    const msgBox = document.getElementById("cAlerta");
    const userId = sessionStorage.getItem("customer.id"); // Get current user's ID from session storage

    // Fetch all customers from server
    fetch('/CRUDBankServerSide/webresources/customer', { method: 'GET' })
        .then(response => {
            if (!response.ok) { // Handle HTTP errors
                return response.text().then(text => {
                    throw new Error(`HTTP Error ${response.status}: ${text}`);
                });
            }
            return response.text(); // Return response as text (XML string)
        })
        .then(xmlString => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "application/xml"); // Parse XML string
            const customers = xmlDoc.getElementsByTagName("customer"); // Get all <customer> nodes

            console.log("User ID buscado:", userId);
            console.log("XML recibido:", xmlString);

            // Find the current customer node by matching user ID
            let foundCustomer = null;
            for (let i = 0; i < customers.length; i++) {
                const idNode = customers[i].querySelector(":scope > id"); // Direct child <id> of customer
                if (idNode && idNode.textContent.trim() === userId) {
                    foundCustomer = customers[i];
                    break;
                }
            }

            if (!foundCustomer)
                throw new Error("Customer not found");

            // Get current password from XML
            const OGpass = foundCustomer.querySelector(":scope > password")?.textContent.trim() || null;
            console.log(OGpass);
            if (!OGpass)
                throw new Error("Customer has no registered password");
            if (OGpass !== oldPassword)
                throw new Error("The old password does not match");

            // Helper function to get text content of a child node, or empty string if missing
            const getNodeText = (tag) => foundCustomer.querySelector(`:scope > ${tag}`)?.textContent.trim() || "";

            // Build new XML with updated password
            const xmlData = `
                <customer>
                    <city>${getNodeText("city")}</city>
                    <email>${getNodeText("email")}</email>
                    <firstName>${getNodeText("firstName")}</firstName>
                    <id>${userId}</id>
                    <lastName>${getNodeText("lastName")}</lastName>
                    <middleInitial>${getNodeText("middleInitial")}</middleInitial>
                    <password>${newPassword}</password>
                    <phone>${getNodeText("phone")}</phone>
                    <state>${getNodeText("state")}</state>
                    <street>${getNodeText("street")}</street>
                    <zip>${getNodeText("zip")}</zip>
                </customer>
            `.trim();

            // Send PUT request to update the customer password
            return fetch('/CRUDBankServerSide/webresources/customer', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/xml' },
                body: xmlData
            });
        })
        .then(response => {
            if (!response.ok)
                throw new Error('Error updating password on server'); // Check if server accepted the update
            return response.text();
        })
        .then(text => {
            // Show success message and redirect to main page after 3 seconds
            msgBox.textContent = 'Password successfully changed';
            msgBox.style.display = 'block';
            msgBox.style.backgroundColor = 'green';
            document.getElementById("titulo").style.backgroundColor = 'green';
            setTimeout(() => { window.location.href = "../main.html"; }, 3000);
        })
        .catch(error => {
            // Display any errors during fetching or updating
            console.error(error);
            msgBox.textContent = '✖️ ' + error.message;
            msgBox.style.display = 'block';
            msgBox.style.backgroundColor = 'red';
            document.getElementById("titulo").style.backgroundColor = 'red';
        });
}
