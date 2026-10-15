
"use strict";

const STORAGE_KEY = "careerTrackApplications";

const validStatuses = [
    "Applied",
    "Interview",
    "Offer",
    "Rejected"
];

// Read saved applications.
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

// Format YYYY-MM-DD as DD/MM/YYYY.
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

// Get today's date using the local timezone.
function getToday() {
    const today = new Date();

    const localDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().split("T")[0];
}

// Safely create a text element.
function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    element.textContent = text;

    return element;
}

// Update the four main statistics and status overview.
function updateDashboardStats(applications) {
    const total = applications.length;

    const counts = {
        Applied: 0,
        Interview: 0,
        Offer: 0,
        Rejected: 0
    };

    applications.forEach(function (app) {
        if (validStatuses.includes(app.status)) {
            counts[app.status]++;
        }
    });

    document.getElementById("totalApplications").textContent = total;
    document.getElementById("totalInterviews").textContent = counts.Interview;
    document.getElementById("totalOffers").textContent = counts.Offer;
    document.getElementById("totalRejected").textContent = counts.Rejected;

    document.getElementById("overviewApplied").textContent = counts.Applied;
    document.getElementById("overviewInterview").textContent = counts.Interview;
    document.getElementById("overviewOffer").textContent = counts.Offer;
    document.getElementById("overviewRejected").textContent = counts.Rejected;
}

// Display upcoming interviews.
function displayUpcomingInterviews(applications) {
    const container = document.getElementById("upcomingInterviews");
    const today = getToday();

    const upcoming = applications
        .filter(function (app) {
            return (
                app.status === "Interview" &&
                app.interviewDate &&
                app.interviewDate >= today
            );
        })
        .sort(function (a, b) {
            return a.interviewDate.localeCompare(b.interviewDate);
        })
        .slice(0, 5);

    container.replaceChildren();

    if (upcoming.length === 0) {
        container.appendChild(
            createTextElement(
                "p",
                "",
                "No upcoming interviews yet."
            )
        );

        return;
    }

    upcoming.forEach(function (app) {
        const card = document.createElement("div");
        card.className = "upcoming-interview-item";

        const details = document.createElement("div");
        details.className = "upcoming-interview-details";

        details.append(
            createTextElement(
                "h3",
                "",
                app.company || "Unknown company"
            ),
            createTextElement(
                "p",
                "",
                app.jobTitle || "Untitled position"
            ),
            createTextElement(
                "span",
                "upcoming-interview-date",
                "📅 " + formatDate(app.interviewDate)
            )
        );

        card.appendChild(details);
        container.appendChild(card);
    });
}

// Display the five most recent applications.
function displayRecentApplications(applications) {
    const tableBody = document.getElementById("recentApplicationsBody");
    const emptyState = document.getElementById("recentEmptyState");

    tableBody.replaceChildren();

    const recent = [...applications]
        .sort(function (a, b) {
            return (b.applicationDate || "").localeCompare(
                a.applicationDate || ""
            );
        })
        .slice(0, 5);

    if (recent.length === 0) {
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;

    recent.forEach(function (app) {
        const row = document.createElement("tr");

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

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(app.applicationDate);

        const statusCell = document.createElement("td");

        const status = validStatuses.includes(app.status)
            ? app.status
            : "Applied";

        statusCell.appendChild(
            createTextElement(
                "span",
                "status-badge status-" + status.toLowerCase(),
                status
            )
        );

        row.append(companyCell, dateCell, statusCell);
        tableBody.appendChild(row);
    });
}

// Load and update the entire dashboard.
function loadDashboard() {
    try {
        const applications = getApplications();

        updateDashboardStats(applications);
        displayUpcomingInterviews(applications);
        displayRecentApplications(applications);

    } catch (error) {
        console.error("Could not load dashboard data:", error);

        document.getElementById("upcomingInterviews").replaceChildren(
            createTextElement(
                "p",
                "",
                "Unable to load saved applications. Please check your browser console."
            )
        );
    }
}

// Refresh when returning from another page.
window.addEventListener("pageshow", loadDashboard);

// Refresh if another browser tab changes application records.
window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY || event.key === null) {
        loadDashboard();
    }
});

// Initial dashboard update.
loadDashboard();
