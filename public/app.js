const STORAGE_KEY = "darkCalendarData";

const state = {
  currentDate: new Date(),
  events: [],
  countdowns: [],
  removedHolidays: [],
  settings: {
    notifications: true
  }
};

const HOLIDAYS = [
  {
    id: "new-years",
    name: "New Year's Day",
    month: 0,
    day: 1
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    month: 1,
    day: 14
  },
  {
    id: "easter",
    name: "Easter",
    dynamic: "easter"
  },
  {
    id: "halloween",
    name: "Halloween",
    month: 9,
    day: 31
  },
  {
    id: "thanksgiving",
    name: "Thanksgiving",
    dynamic: "thanksgiving"
  },
  {
    id: "christmas",
    name: "Christmas",
    month: 11,
    day: 25
  }
];

const monthTitle = document.getElementById("monthTitle");
const todayLabel = document.getElementById("todayLabel");
const calendarGrid = document.getElementById("calendarGrid");
const upcomingEvents = document.getElementById("upcomingEvents");
const countdownList = document.getElementById("countdownList");

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    const data = JSON.parse(saved);

    state.events = Array.isArray(data.events) ? data.events : [];
    state.countdowns = Array.isArray(data.countdowns)
      ? data.countdowns
      : [];
    state.removedHolidays = Array.isArray(data.removedHolidays)
      ? data.removedHolidays
      : [];

    if (data.settings) {
      state.settings = {
        ...state.settings,
        ...data.settings
      };
    }
  } catch (error) {
    console.error("Could not load calendar data:", error);
  }
}

function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      events: state.events,
      countdowns: state.countdowns,
      removedHolidays: state.removedHolidays,
      settings: state.settings
    })
  );
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getToday() {
  return new Date();
}

function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h =
    (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l =
    (32 + 2 * e + 2 * i - h - k) % 7;
  const m =
    Math.floor((a + 11 * h + 22 * l) / 451);

  const month =
    Math.floor((h + l - 7 * m + 114) / 31);

  const day =
    ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

function getThanksgivingDate(year) {
  const date = new Date(year, 10, 1);

  while (date.getDay() !== 4) {
    date.setDate(date.getDate() + 1);
  }

  date.setDate(date.getDate() + 21);

  return date;
}

function getHolidayDate(holiday, year) {
  if (holiday.dynamic === "easter") {
    return getEasterDate(year);
  }

  if (holiday.dynamic === "thanksgiving") {
    return getThanksgivingDate(year);
  }

  return new Date(year, holiday.month, holiday.day);
}

function getHolidayEventsForYear(year) {
  return HOLIDAYS
    .filter(holiday => !state.removedHolidays.includes(holiday.id))
    .map(holiday => {
      const date = getHolidayDate(holiday, year);

      return {
        id: `holiday-${holiday.id}-${year}`,
        holidayId: holiday.id,
        name: holiday.name,
        date: formatDateKey(date),
        holiday: true
      };
    });
}

function getAllEvents() {
  const year = state.currentDate.getFullYear();

  const holidays = [
    ...getHolidayEventsForYear(year - 1),
    ...getHolidayEventsForYear(year),
    ...getHolidayEventsForYear(year + 1)
  ];

  return [...state.events, ...holidays];
}

function getEventsForDate(date) {
  const key = formatDateKey(date);

  return getAllEvents().filter(event => event.date === key);
}

function renderCalendar() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();

  const monthName = state.currentDate.toLocaleDateString(
    undefined,
    {
      month: "long",
      year: "numeric"
    }
  );

  monthTitle.textContent = monthName;

  const today = getToday();

  todayLabel.textContent =
    `Today · ${today.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    })}`;

  calendarGrid.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const previousMonthLastDay =
    new Date(year, month, 0).getDate();

  const startingDay = firstDay.getDay();

  const totalCells =
    Math.ceil(
      (startingDay + lastDay.getDate()) / 7
    ) * 7;

  for (let i = 0; i < totalCells; i++) {
    let date;
    let otherMonth = false;

    if (i < startingDay) {
      const day =
        previousMonthLastDay -
        startingDay +
        i +
        1;

      date = new Date(year, month - 1, day);
      otherMonth = true;
    } else if (
      i >= startingDay + lastDay.getDate()
    ) {
      const day =
        i -
        startingDay -
        lastDay.getDate() +
        1;

      date = new Date(year, month + 1, day);
      otherMonth = true;
    } else {
      const day =
        i -
        startingDay +
        1;

      date = new Date(year, month, day);
    }

    const dayElement = document.createElement("button");

    dayElement.className = "day";

    if (otherMonth) {
      dayElement.classList.add("other-month");
    }

    if (isSameDay(date, today)) {
      dayElement.classList.add("today");
    }

    const events = getEventsForDate(date);

    if (events.length > 0) {
      dayElement.classList.add("has-event");
    }

    if (events.some(event => event.holiday)) {
      dayElement.classList.add("holiday");
    }

    const number = document.createElement("span");

    number.className = "day-number";
    number.textContent = date.getDate();

    dayElement.appendChild(number);

    dayElement.addEventListener("click", () => {
      showDayMenu(date);
    });

    calendarGrid.appendChild(dayElement);
  }

  renderUpcoming();
}

function renderUpcoming() {
  const today = getToday();

  const events = getAllEvents()
    .filter(event => {
      const date = parseDateKey(event.date);
      return date >= new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
    })
    .sort((a, b) =>
      parseDateKey(a.date) -
      parseDateKey(b.date)
    )
    .slice(0, 8);

  upcomingEvents.innerHTML = "";

  if (events.length === 0) {
    upcomingEvents.innerHTML =
      `<div class="empty-state">
        Nothing coming up yet.
      </div>`;

    return;
  }

  events.forEach(event => {
    const date = parseDateKey(event.date);

    const card =
      document.createElement("button");

    card.className = "event-card";

    card.innerHTML = `
      <div class="event-date">
        <strong>${date.getDate()}</strong>
        <span>
          ${date.toLocaleDateString(undefined, {
            month: "short"
          })}
        </span>
      </div>

      <div class="event-info">
        <strong>${escapeHtml(event.name)}</strong>
        <span>
          ${date.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
          })}
        </span>
      </div>
    `;

    card.addEventListener("click", () => {
      showEventDetails(event);
    });

    upcomingEvents.appendChild(card);
  });
}

function renderCountdowns() {
  countdownList.innerHTML = "";

  if (state.countdowns.length === 0) {
    countdownList.innerHTML =
      `<div class="empty-state">
        No countdowns yet.<br>
        Press + to create one.
      </div>`;

    return;
  }

  state.countdowns.forEach(countdown => {
    const target = parseDateKey(countdown.date);

    const today = new Date(
      getToday().getFullYear(),
      getToday().getMonth(),
      getToday().getDate()
    );

    const targetDay = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate()
    );

    const difference =
      targetDay.getTime() -
      today.getTime();

    const days = Math.ceil(
      difference / 86400000
    );

    const card =
      document.createElement("div");

    card.className = "countdown-card";

    let numberText;
    let labelText;

    if (days > 1) {
      numberText = days;
      labelText = "days";
    } else if (days === 1) {
      numberText = "1";
      labelText = "day";
    } else if (days === 0) {
      numberText = "Today";
      labelText = "";
    } else {
      numberText = "Passed";
      labelText = "";
    }

    card.innerHTML = `
      <h3>${escapeHtml(countdown.name)}</h3>

      <div class="countdown-number">
        ${numberText}
      </div>

      <div class="countdown-label">
        ${labelText}
      </div>

      <div class="countdown-date">
        ${target.toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric"
        })}
      </div>
    `;

    card.addEventListener("click", () => {
      if (
        confirm(
          `Delete the "${countdown.name}" countdown?`
        )
      ) {
        state.countdowns =
          state.countdowns.filter(
            item => item.id !== countdown.id
          );

        saveData();
        renderCountdowns();
      }
    });

    countdownList.appendChild(card);
  });
}

function showDayMenu(date) {
  const events = getEventsForDate(date);

  const dateText =
    date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });

  let message =
    `${dateText}\n\n`;

  if (events.length > 0) {
    message +=
      events
        .map(event => `• ${event.name}`)
        .join("\n");

    message += "\n\n";
  }

  message +=
    "Choose OK to add an event on this day.";

  if (confirm(message)) {
    showAddEventModal(date);
  }
}

function showAddEventModal(selectedDate = null) {
  const defaultDate =
    selectedDate
      ? formatDateKey(selectedDate)
      : formatDateKey(getToday());

  const name =
    prompt("Event name:");

  if (!name || !name.trim()) {
    return;
  }

  const date =
    prompt(
      "Date (YYYY-MM-DD):",
      defaultDate
    );

  if (!date || !isValidDateKey(date)) {
    alert(
      "Please enter a valid date like 2026-12-25."
    );

    return;
  }

  const event = {
    id:
      crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),

    name: name.trim(),
    date,

    createdAt: new Date().toISOString(),

    notification: {
      enabled: false,
      minutesBefore: 1440
    }
  };

  state.events.push(event);

  saveData();
  renderCalendar();
}

function showEventDetails(event) {
  const date =
    parseDateKey(event.date);

  if (event.holiday) {
    const action =
      confirm(
        `${event.name}\n\n${date.toLocaleDateString(
          undefined,
          {
            month: "long",
            day: "numeric",
            year: "numeric"
          }
        )}\n\nPress OK to remove this holiday from your calendar.`
      );

    if (action) {
      removeHoliday(event.holidayId);
    }

    return;
  }

  const action =
    confirm(
      `${event.name}\n\n${date.toLocaleDateString(
        undefined,
        {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        }
      )}\n\nPress OK to delete this event.`
    );

  if (action) {
    state.events =
      state.events.filter(
        item => item.id !== event.id
      );

    state.countdowns =
      state.countdowns.filter(
        countdown =>
          countdown.eventId !== event.id
      );

    saveData();

    renderCalendar();
    renderCountdowns();
  }
}

function removeHoliday(holidayId) {
  if (
    !state.removedHolidays.includes(
      holidayId
    )
  ) {
    state.removedHolidays.push(
      holidayId
    );
  }

  saveData();
  renderCalendar();
}

function addCountdown() {
  const allEvents =
    getAllEvents();

  let choice =
    prompt(
      "Countdown name:\n\n" +
      "Type the name of an existing calendar event, " +
      "or enter a new countdown name."
    );

  if (!choice || !choice.trim()) {
    return;
  }

  choice = choice.trim();

  const matchingEvent =
    allEvents.find(
      event =>
        event.name.toLowerCase() ===
        choice.toLowerCase()
    );

  let date;

  if (matchingEvent) {
    date = matchingEvent.date;
  } else {
    date =
      prompt(
        "Date for the countdown (YYYY-MM-DD):"
      );

    if (
      !date ||
      !isValidDateKey(date)
    ) {
      alert(
        "Please enter a valid date like 2026-12-25."
      );

      return;
    }
  }

  state.countdowns.push({
    id:
      crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),

    name: choice,
    date,

    eventId:
      matchingEvent
        ? matchingEvent.id
        : null
  });

  saveData();
  renderCountdowns();
}

function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date =
    parseDateKey(value);

  return (
    !Number.isNaN(date.getTime()) &&
    formatDateKey(date) === value
  );
}

function escapeHtml(value) {
  const div =
    document.createElement("div");

  div.textContent = value;

  return div.innerHTML;
}

function goToPreviousMonth() {
  state.currentDate =
    new Date(
      state.currentDate.getFullYear(),
      state.currentDate.getMonth() - 1,
      1
    );

  renderCalendar();
}

function goToNextMonth() {
  state.currentDate =
    new Date(
      state.currentDate.getFullYear(),
      state.currentDate.getMonth() + 1,
      1
    );

  renderCalendar();
}

function goToToday() {
  state.currentDate =
    new Date();

  renderCalendar();
}

function setupNavigation() {
  document
    .getElementById("previousMonth")
    .addEventListener(
      "click",
      goToPreviousMonth
    );

  document
    .getElementById("nextMonth")
    .addEventListener(
      "click",
      goToNextMonth
    );

  document
    .getElementById("todayButton")
    .addEventListener(
      "click",
      goToToday
    );

  document
    .getElementById("addEventButton")
    .addEventListener(
      "click",
      () => showAddEventModal()
    );

  document
    .getElementById("addCountdownButton")
    .addEventListener(
      "click",
      addCountdown
    );
}

function setupTabs() {
  const tabs =
    document.querySelectorAll(
      ".nav-tab"
    );

  const screens =
    document.querySelectorAll(
      ".screen"
    );

  tabs.forEach(tab => {
    tab.addEventListener(
      "click",
      () => {
        const screenId =
          tab.dataset.screen;

        tabs.forEach(item =>
          item.classList.remove(
            "active"
          )
        );

        screens.forEach(screen =>
          screen.classList.remove(
            "active"
          )
        );

        tab.classList.add(
          "active"
        );

        document
          .getElementById(screenId)
          .classList.add("active");

        if (
          screenId ===
          "countdownScreen"
        ) {
          renderCountdowns();
        }
      }
    );
  });
}

function setupSwipe() {
  let startX = 0;
  let startY = 0;

  calendarGrid.addEventListener(
    "touchstart",
    event => {
      const touch =
        event.changedTouches[0];

      startX = touch.screenX;
      startY = touch.screenY;
    },
    { passive: true }
  );

  calendarGrid.addEventListener(
    "touchend",
    event => {
      const touch =
        event.changedTouches[0];

      const differenceX =
        touch.screenX - startX;

      const differenceY =
        touch.screenY - startY;

      if (
        Math.abs(differenceX) < 60 ||
        Math.abs(differenceX) <
          Math.abs(differenceY)
      ) {
        return;
      }

      if (differenceX < 0) {
        goToNextMonth();
      } else {
        goToPreviousMonth();
      }
    },
    { passive: true }
  );
}

function setupNotifications() {
  if (
    !("Notification" in window)
  ) {
    return;
  }

  document
    .getElementById("settingsButton")
    .addEventListener(
      "click",
      async () => {
        if (
          Notification.permission ===
          "default"
        ) {
          const permission =
            await Notification.requestPermission();

          if (
            permission === "granted"
          ) {
            alert(
              "Notifications are enabled."
            );
          }
        } else if (
          Notification.permission ===
          "granted"
        ) {
          alert(
            "Notifications are already enabled."
          );
        } else {
          alert(
            "Notifications are blocked. You can enable them in your browser settings."
          );
        }
      }
    );
}

function initialize() {
  loadData();

  setupNavigation();
  setupTabs();
  setupSwipe();
  setupNotifications();

  renderCalendar();
  renderCountdowns();

  setInterval(() => {
    renderCountdowns();
  }, 60000);
}

initialize();
