# Chores System

<aside>
🟠

**Chores System Rules**

- The **Chores System database is the single source of truth**
- All chores must live inside the database
- Do not create chores as standalone pages
- Views on this page are only different ways to see the same data
- Do not duplicate chores across views
- Room is a **relation** and should not be converted
- Assigned To uses **Person** and should not be changed
- Frequency options may include long-term values, but Daily / Weekly / Monthly are the primary operational ones
- Status meanings:
    - Not started = ready to do
    - In progress = actively being worked on
    - Done = completed
    - Archive = no longer active
</aside>

### 📅 How This System Is Used Daily

- Family members check the **TODAY** view when logging in
- TODAY shows only chores due today
- WEEKLY shows the current week’s workload
- CALENDAR shows long-term planning
- PROGRESS shows completion trends
- ARCHIVE is for completed or retired chores

### 🔁 Assignment Logic (Manual by Design)

- Assigned To is set manually for flexibility
- Kitchen and bathroom rotations are managed by assignment, not automation
- Only one primary chore per person per day when possible
- Exceptions (ex: kitchen + trash) are allowed intentionally
- If assignments change, update the Assigned To field — do not create duplicates

---

<aside>
📌

**System Integrity Reminder**

- If something looks missing, check filters first
- If a chore disappears, it is likely archived or filtered
- This page explains the system — it does not store chores
</aside>

| [🧹 CHORES](view://2ef97e9c-2a31-81be-ba8b-000c820fc94e) | [📅 CALENDAR](view://2ef97e9c-2a31-81b7-bfba-000cad0a4109) | [🗓 WEEKLY](view://2ef97e9c-2a31-81d1-af6b-000c49a7b2fc) | [✅ TODAY](view://2ef97e9c-2a31-8128-b9be-000ccf9a9196) | [📊 PROGRESS](view://2ef97e9c-2a31-81ef-9c45-000c02d996fe) | [💤 UNSCHEDULED](view://2ef97e9c-2a31-815d-bba8-000cb0e62b8d) | [🗄 ARCHIVE](view://2ef97e9c-2a31-81c3-937e-000caa8fd129) |
| --- | --- | --- | --- | --- | --- | --- |

### ✅ Today’s Chores

[Untitled](Chores%20System/Untitled%20515b76931dc343a3885a339716d10ce7.csv)

### 🗓 This Week

[Untitled](Chores%20System/Untitled%20112ffd36d5204994b431834099aeff69.csv)

### 📅 Calendar

[Untitled](Chores%20System/Untitled%2089e51fae79a84f30b44b2446455cf569.csv)

### 🧹 All Chores

[Untitled](Chores%20System/Untitled%20ab1782f07307458dbcefcef2fb860a5d.csv)

### 📊 Progress

[Untitled](Chores%20System/Untitled%20b1438b63426448e7a4e28429f1d50aa1.csv)

### 💤 Unscheduled

[Untitled](Chores%20System/Untitled%20d0d255e79ffd4b39b6b6108c35b85914.csv)

### 🗄 Archive

[Untitled](Chores%20System/Untitled%20faff167dc18d4d70be080e2986503e61.csv)

## 🧺 Lorraine — Daily Chores

<aside>

This list shows Lorraine's daily responsibilities. Tasks rotate daily and are checked off here.

</aside>

[Untitled](Chores%20System/Untitled%2016bef17d905140658f373febe842d893.csv)

---

[🏠 Daily Household Landing](Chores%20System/%F0%9F%8F%A0%20Daily%20Household%20Landing%20c129c40fe6b84fa4bbe9465fe91a0836.md)