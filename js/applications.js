
const STORAGE_KEY = "careerTrackApplications";

const tableBody = document.getElementById("applicationsTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortOrder = document.getElementById("sortOrder");
const resultsCount = document.getElementById("resultsCount");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyDescription = document.getElementById("emptyDescription");

// Read saved application records
function getApplications() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved === null) {
            return [];
        }

        const applications = JSON.parse(saved);

        return Array.isArray(applications) ? applications : [];
    } catch (error) {
        console.error("Could not read applications:", error);
        return [];
    }
}

// Save changes to the browser
function saveApplications(applications) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

// Format a date for display
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

// Create a table cell safely
function createCell() {
    return document.createElement("td");
}

// Display summary statistics
function updateSummary(applications) {
    document.getElementById("listTotal").textContent = applications.length;

    document.getElementById("listInterviews").textContent =
        applications.filter(app => app.status === "Interview").length;

    document.getElementById("listOffers").textContent =
        applications.filter(app => app.status === "Offer").length;

    document.getElementById("listRejected").textContent =
        applications.filter(app => app.status === "Rejected").length;
}

// Display all matching applications
function displayApplications() {
    const allApplications = getApplications();

    updateSummary(allApplications);

    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    let filteredApplications = allApplications.filter(function (app) {
        const company = String(app.company || "").toLowerCase();
        const jobTitle = String(app.jobTitle || "").toLowerCase();

        const matchesSearch =
            company.includes(searchTerm) ||
            jobTitle.includes(searchTerm);

        const matchesStatus =
            selectedStatus === "All" || app.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    // Sort by application date
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

    if (filteredApplications.length === 0) {
        emptyState.hidden = false;

        if (allApplications.length === 0) {
            emptyTitle.textContent = "No applications yet";
            emptyDescription.textContent =
                "Add your first application to get started.";
        } else {
            emptyTitle.textContent = "No matching applications";
            emptyDescription.textContent =
                "Try a different search term or status filter.";
        }

        return;
    }

    emptyState.hidden = true;

    filteredApplications.forEach(function (app) {
        const row = document.createElement("tr");

        // Company and job title
        const companyCell = createCell();

        const companyName = document.createElement("div");
        companyName.className = "company-name";
        companyName.textContent = app.company || "Unknown company";

        const jobName = document.createElement("div");
        jobName.className = "job-name";
        jobName.textContent = app.jobTitle || "Untitled position";

        companyCell.append(companyName, jobName);

        // Application date
        const dateCell = createCell();
        dateCell.textContent = formatDate(app.applicationDate);

        // Status
        const statusCell = createCell();
        const statusBadge = document.createElement("span");
        const validStatuses = ["Applied", "Interview", "Offer", "Rejected"];
        const status = validStatuses.includes(app.status)
            ? app.status
            : "Applied";

        statusBadge.className =
            "status-badge status-" + status.toLowerCase();
        statusBadge.textContent = status;
        statusCell.appendChild(statusBadge);

        // Interview date
        const interviewCell = createCell();
        interviewCell.textContent = formatDate(app.interviewDate);

        // Actions
        const actionsCell = createCell();
        const actions = document.createElement("div");
        actions.className = "application-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function () {
            editApplication(app.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-button delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function () {
            deleteApplication(app.id);
        });

        actions.append(editButton, deleteButton);
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

// Edit an application
function editApplication(id) {
    const applications = getApplications();

    const application = applications.find(function (app) {
        return String(app.id) === String(id);
    });

    if (!application) {
        alert("Application not found.");
        return;
    }

    const company = prompt("Company name:", application.company);

    if (company === null) {
        return;
    }

    const jobTitle = prompt("Job title:", application.jobTitle);

    if (jobTitle === null) {
        return;
    }

    const status = prompt(
        "Status: Applied, Interview, Offer, or Rejected",
        application.status
    );

    if (status === null) {
        return;
    }

    const validStatuses = ["Applied", "Interview", "Offer", "Rejected"];
    const cleanCompany = company.trim();
    const cleanJobTitle = jobTitle.trim();
    const cleanStatus = status.trim().toLowerCase();

    const matchingStatus = validStatuses.find(function (item) {
        return item.toLowerCase() === cleanStatus;
    });

    if (!cleanCompany || !cleanJobTitle || !matchingStatus) {
        alert("Please enter a company, job title, and valid status.");
        return;
    }

    application.company = cleanCompany;
    application.jobTitle = cleanJobTitle;
    application.status = matchingStatus;

    try {
        saveApplications(applications);
        displayApplications();
    } catch (error) {
        console.error("Could not update application:", error);
        alert("Unable to save the changes.");
    }
}

// Delete an application
function deleteApplication(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this application?"
    );

    if (!confirmed) {
        return;
    }

    const applications = getApplications();

    const updatedApplications = applications.filter(function (app) {
        return String(app.id) !== String(id);
    });

    try {
        saveApplications(updatedApplications);
        displayApplications();
    } catch (error) {
        console.error("Could not delete application:", error);
        alert("Unable to delete the application.");
    }
}

// Update the list when the user searches or filters
searchInput.addEventListener("input", displayApplications);
statusFilter.addEventListener("change", displayApplications);
sortOrder.addEventListener("change", displayApplications);

// Initial display
displayApplications();
