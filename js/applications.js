
"use strict";

const STORAGE_KEY = "careerTrackApplications";

const tableBody = document.getElementById("applicationsTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortOrder = document.getElementById("sortOrder");

const resultsCount = document.getElementById("resultsCount");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyDescription = document.getElementById("emptyDescription");

const detailsDialog = document.getElementById("detailsDialog");
const detailsContent = document.getElementById("detailsContent");
const closeDetailsButton = document.getElementById("closeDetails");

const allowedStatuses = [
    "Applied",
    "Interview",
    "Offer",
    "Rejected"
];

// Read saved applications from localStorage.
function getApplications() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
        return [];
    }

    const applications = JSON.parse(saved);

    if (!Array.isArray(applications)) {
        throw new Error("Saved application data is not a list.");
    }

    return applications;
}

// Save applications to localStorage.
function saveApplications(applications) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(applications)
    );
}

// Format a date as DD/MM/YYYY.
function formatDate(dateString) {
    if (!dateString) {
        return "—";
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return "—";
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Create an HTML element containing text safely.
function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    element.textContent = text;

    return element;
}

// Update the statistics at the top of the page.
function updateSummary(applications) {
    document.getElementById("listTotal").textContent =
        applications.length;

    document.getElementById("listInterviews").textContent =
        applications.filter(function (app) {
            return app.status === "Interview";
        }).length;

    document.getElementById("listOffers").textContent =
        applications.filter(function (app) {
            return app.status === "Offer";
        }).length;

    document.getElementById("listRejected").textContent =
        applications.filter(function (app) {
            return app.status === "Rejected";
        }).length;
}

// Display the appropriate empty-state message.
function showEmptyState(allApplications, filteredApplications) {
    emptyState.hidden = filteredApplications.length !== 0;

    if (allApplications.length === 0) {
        emptyTitle.textContent = "No applications yet";

        emptyDescription.textContent =
            "Add your first application to get started.";
    } else {
        emptyTitle.textContent = "No matching applications";

        emptyDescription.textContent =
            "Try another search term or status filter.";
    }
}

// Create a reusable action button.
function createActionButton(text, className, action) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "action-button";

    if (className) {
        button.classList.add(className);
    }

    button.textContent = text;
    button.addEventListener("click", action);

    return button;
}

// Display all applications after applying search and filters.
function displayApplications() {
    let allApplications;

    try {
        allApplications = getApplications();
    } catch (error) {
        console.error("Could not load applications:", error);

        tableBody.replaceChildren();
        resultsCount.textContent = "Unable to load applications";

        emptyState.hidden = false;
        emptyTitle.textContent = "Could not load saved data";

        emptyDescription.textContent =
            "Please check your browser console for details.";

        return;
    }

    updateSummary(allApplications);

    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    // Search by company name or job title.
    let filteredApplications = allApplications.filter(function (app) {
        const company = String(app.company || "").toLowerCase();
        const jobTitle = String(app.jobTitle || "").toLowerCase();

        const matchesSearch =
            company.includes(searchTerm) ||
            jobTitle.includes(searchTerm);

        const matchesStatus =
            selectedStatus === "All" ||
            app.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    // Sort applications by date.
    filteredApplications.sort(function (a, b) {
        const dateA = a.applicationDate || "";
        const dateB = b.applicationDate || "";

        if (sortOrder.value === "oldest") {
            return dateA.localeCompare(dateB);
        }

        return dateB.localeCompare(dateA);
    });

    tableBody.replaceChildren();

    resultsCount.textContent =
        `${filteredApplications.length} application` +
        (filteredApplications.length === 1 ? "" : "s");

    showEmptyState(allApplications, filteredApplications);

    // Create one table row for each application.
    filteredApplications.forEach(function (app) {
        const row = document.createElement("tr");

        // Company and job title.
        const companyCell = document.createElement("td");

        companyCell.append(
            createTextElement(
                "div",
                "company-name",
                app.company || "Unknown company"
            ),
            createTextElement(
                "div",
                "job-name",
                app.jobTitle || "Untitled position"
            )
        );

        // Application date.
        const dateCell = document.createElement("td");

        dateCell.textContent = formatDate(app.applicationDate);

        // Application status.
        const statusCell = document.createElement("td");

        const safeStatus = allowedStatuses.includes(app.status)
            ? app.status
            : "Applied";

        const statusBadge = createTextElement(
            "span",
            "status-badge status-" + safeStatus.toLowerCase(),
            safeStatus
        );

        statusCell.appendChild(statusBadge);

        // Interview date.
        const interviewCell = document.createElement("td");

        interviewCell.textContent = formatDate(app.interviewDate);

        // View, edit and delete buttons.
        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");

        actions.className = "application-actions";

        actions.append(
            createActionButton("View", "", function () {
                viewApplication(app.id);
            }),

            createActionButton("Edit", "", function () {
                editApplication(app.id);
            }),

            createActionButton("Delete", "delete-button", function () {
                deleteApplication(app.id);
            })
        );

        actionsCell.appendChild(actions);

        row.append(
            companyCell,
            dateCell,
            statusCell,
            interviewCell,
            actionsCell
        );

        tableBody.appendChild(row);
    });
}

// Add a detail row to the application details dialog.
function addDetailRow(label, value, link) {
    const row = document.createElement("div");

    row.className = "details-row";

    const labelElement = createTextElement(
        "span",
        "details-label",
        label
    );

    const valueElement = document.createElement("div");

    valueElement.className = "details-value";

    if (link && value) {
        const anchor = document.createElement("a");

        anchor.href = link;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = value;

        valueElement.appendChild(anchor);
    } else {
        valueElement.textContent = value || "Not provided";
    }

    row.append(labelElement, valueElement);

    detailsContent.appendChild(row);
}

// View the complete details of an application.
function viewApplication(id) {
    let applications;

    try {
        applications = getApplications();
    } catch (error) {
        alert("Could not load application details.");
        return;
    }

    const app = applications.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!app) {
        alert("Application not found.");
        return;
    }

    detailsContent.replaceChildren();

    addDetailRow("COMPANY", app.company);
    addDetailRow("JOB TITLE", app.jobTitle);

    addDetailRow(
        "APPLICATION DATE",
        formatDate(app.applicationDate)
    );

    addDetailRow("STATUS", app.status);

    addDetailRow(
        "INTERVIEW DATE",
        formatDate(app.interviewDate)
    );

    if (app.jobLink) {
        addDetailRow("JOB POSTING", app.jobLink, app.jobLink);
    } else {
        addDetailRow("JOB POSTING", "");
    }

    addDetailRow("NOTES", app.notes);

    detailsDialog.showModal();
}

// Validate a date without relying on UTC conversion.
function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const parts = value.split("-").map(Number);

    const date = new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

    return (
        date.getFullYear() === parts[0] &&
        date.getMonth() === parts[1] - 1 &&
        date.getDate() === parts[2]
    );
}

// Edit an existing application.
function editApplication(id) {
    let applications;

    try {
        applications = getApplications();
    } catch (error) {
        alert("Could not load applications for editing.");
        return;
    }

    const app = applications.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!app) {
        alert("Application not found.");
        return;
    }

    const company = prompt(
        "Company name:",
        app.company || ""
    );

    if (company === null) return;

    const jobTitle = prompt(
        "Job title:",
        app.jobTitle || ""
    );

    if (jobTitle === null) return;

    const applicationDate = prompt(
        "Application date (YYYY-MM-DD):",
        app.applicationDate || ""
    );

    if (applicationDate === null) return;

    const status = prompt(
        "Status: Applied, Interview, Offer, or Rejected",
        app.status || "Applied"
    );

    if (status === null) return;

    const interviewDate = prompt(
        "Interview date (YYYY-MM-DD), or leave blank:",
        app.interviewDate || ""
    );

    if (interviewDate === null) return;

    const jobLink = prompt(
        "Job posting link, or leave blank:",
        app.jobLink || ""
    );

    if (jobLink === null) return;

    const notes = prompt(
        "Notes:",
        app.notes || ""
    );

    if (notes === null) return;

    const cleanCompany = company.trim();
    const cleanJobTitle = jobTitle.trim();
    const cleanApplicationDate = applicationDate.trim();
    const cleanInterviewDate = interviewDate.trim();
    const cleanJobLinkInput = jobLink.trim();

    const matchingStatus = allowedStatuses.find(function (item) {
        return item.toLowerCase() === status.trim().toLowerCase();
    });

    // Check required fields.
    if (!cleanCompany || !cleanJobTitle || !matchingStatus) {
        alert(
            "Please enter a company, job title and valid application status."
        );
        return;
    }

    // Check application date.
    if (!isValidDate(cleanApplicationDate)) {
        alert("Please enter a valid application date in YYYY-MM-DD format.");
        return;
    }

    // Check that the application date is not in the future.
    const today = new Date();

    const localToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    const applicationDateObject = new Date(
        cleanApplicationDate + "T00:00:00"
    );

    if (applicationDateObject > localToday) {
        alert("The application date cannot be in the future.");
        return;
    }

    // Check interview date, if provided.
    if (
        cleanInterviewDate &&
        !isValidDate(cleanInterviewDate)
    ) {
        alert("Please enter a valid interview date.");
        return;
    }

    if (
        cleanInterviewDate &&
        cleanInterviewDate < cleanApplicationDate
    ) {
        alert("The interview date cannot be before the application date.");
        return;
    }

    // Validate the optional job posting link.
    let cleanJobLink = "";

    if (cleanJobLinkInput) {
        try {
            const url = new URL(cleanJobLinkInput);

            if (
                url.protocol !== "https:" &&
                url.protocol !== "http:"
            ) {
                throw new Error("Invalid URL protocol");
            }

            cleanJobLink = url.href;

        } catch (error) {
            alert("Please enter a valid HTTP or HTTPS job link.");
            return;
        }
    }

    // Update the existing application.
    app.company = cleanCompany;
    app.jobTitle = cleanJobTitle;
    app.applicationDate = cleanApplicationDate;
    app.status = matchingStatus;
    app.interviewDate = cleanInterviewDate;
    app.jobLink = cleanJobLink;
    app.notes = notes.trim();

    try {
        saveApplications(applications);

        displayApplications();

    } catch (error) {
        console.error("Could not update application:", error);

        alert(
            "Could not save your changes. Please check browser storage and try again."
        );
    }
}

// Delete an application after confirmation.
function deleteApplication(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this application? This cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    try {
        const applications = getApplications();

        const updatedApplications = applications.filter(function (app) {
            return String(app.id) !== String(id);
        });

        saveApplications(updatedApplications);

        displayApplications();

    } catch (error) {
        console.error("Could not delete application:", error);

        alert(
            "Could not delete the application. Please try again."
        );
    }
}

// Close the details dialog.
closeDetailsButton.addEventListener("click", function () {
    detailsDialog.close();
});

// Refresh results when searching, filtering or sorting.
searchInput.addEventListener("input", displayApplications);

statusFilter.addEventListener("change", displayApplications);

sortOrder.addEventListener("change", displayApplications);

// Refresh if another browser tab updates the saved records.
window.addEventListener("storage", function (event) {
    if (
        event.key === STORAGE_KEY ||
        event.key === null
    ) {
        displayApplications();
    }
});

// Load the application list when the page opens.
displayApplications();
