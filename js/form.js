
// Get the application form from the page
const applicationForm = document.getElementById("applicationForm");

// Get the message area
const formMessage = document.getElementById("formMessage");

// Use the same storage key throughout the project
const STORAGE_KEY = "careerTrackApplications";

// Read saved applications from localStorage
function getApplications() {
    const savedApplications = localStorage.getItem(STORAGE_KEY);

    if (savedApplications === null) {
        return [];
    }

    try {
        const applications = JSON.parse(savedApplications);

        return Array.isArray(applications) ? applications : [];
    } catch (error) {
        console.error("Could not read saved applications:", error);
        return [];
    }
}

// Save applications to localStorage
function saveApplications(applications) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

// Set today's date as the default application date
const applicationDate = document.getElementById("applicationDate");

const today = new Date();
const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().split("T")[0];

applicationDate.value = localToday;
applicationDate.max = localToday;

// Do not allow an interview date before today
const interviewDate = document.getElementById("interviewDate");

interviewDate.min = localToday;

// Update the interview date rules when the application date changes
applicationDate.addEventListener("change", function () {
    interviewDate.min = applicationDate.value || localToday;

    if (
        interviewDate.value &&
        interviewDate.value < interviewDate.min
    ) {
        interviewDate.value = "";
    }
});

// Display a message to the user
function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = "form-message " + type;
}

// Save a new application when the form is submitted
applicationForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const company = document.getElementById("company").value.trim();
    const jobTitle = document.getElementById("jobTitle").value.trim();
    const appliedDate = applicationDate.value;
    const status = document.getElementById("status").value;
    const jobLink = document.getElementById("jobLink").value.trim();
    const interview = interviewDate.value;
    const notes = document.getElementById("notes").value.trim();

    // Check required fields
    if (!company || !jobTitle || !appliedDate || !status) {
        showMessage("Please complete all required fields.", "error");
        return;
    }

    // Check that the application date is not in the future
    if (appliedDate > localToday) {
        showMessage(
            "The application date cannot be in the future.",
            "error"
        );
        return;
    }

    // Check the interview date
    if (interview && interview < appliedDate) {
        showMessage(
            "The interview date cannot be before the application date.",
            "error"
        );
        return;
    }

    // Check that the status is one of the allowed options
    const allowedStatuses = [
        "Applied",
        "Interview",
        "Offer",
        "Rejected"
    ];

    if (!allowedStatuses.includes(status)) {
        showMessage("Please select a valid application status.", "error");
        return;
    }

    // Check the job link format if one was provided
    if (jobLink) {
        try {
            const parsedLink = new URL(jobLink);

            if (
                parsedLink.protocol !== "http:" &&
                parsedLink.protocol !== "https:"
            ) {
                showMessage(
                    "Please enter a valid HTTP or HTTPS job link.",
                    "error"
                );
                return;
            }
        } catch (error) {
            showMessage("Please enter a valid job link.", "error");
            return;
        }
    }

    // Create a new application record
    const newApplication = {
        id: (window.crypto && window.crypto.randomUUID)
            ? window.crypto.randomUUID()
            : Date.now().toString(),
        company: company,
        jobTitle: jobTitle,
        applicationDate: appliedDate,
        status: status,
        jobLink: jobLink,
        interviewDate: interview,
        notes: notes
    };

    try {
        // Get existing records and add the new application
        const applications = getApplications();

        applications.push(newApplication);

        // Save all records in the browser
        saveApplications(applications);

        showMessage(
            "Application saved successfully! 🎉",
            "success"
        );

        // Clear the form after a successful save
        applicationForm.reset();

        // Restore today's date as the default
        applicationDate.value = localToday;
        interviewDate.min = localToday;

        // Open the dashboard after a short pause
        setTimeout(function () {
            window.location.href = "index.html";
        }, 1000);

    } catch (error) {
        console.error("Could not save application:", error);

        showMessage(
            "Unable to save your application. Please check your browser storage.",
            "error"
        );
    }
});
