# **Functional Requirements Specification (FRS)**

## **Project: Medice Patient & Volunteer Management App**

**Organization:** Medice (Buenos Aires, Argentina)

**Target Platform:** Progressive Web App (PWA) \- Mobile & Desktop

### **1\. Product Overview & Scope**

**Purpose:**

A centralized, highly accessible platform for the Medice NGO to manage palliative care volunteers, assign them to patients, and maintain a real-time, chronological log of patient follow-ups (*Seguimientos*). It replaces manual Google Forms with tied relational data and provides instant alerts for critical patient situations.

**In Scope:**

* Admin-invite-only user authentication (Role-Based Access Control).  
* Patient registry, including primary caregiver (*cuidador*) data.  
* Admin UI for assigning volunteers to patients and managing hospital lists.  
* Comprehensive visit logging based on the Medice "Seguimiento" form.  
* "Alerta" (Alert) system with global UI highlights and Push Notifications.  
* Personalized volunteer dashboards and public impact statistics.

### **2\. User Roles and Personas**

* **Standard User (Volunteer):** Members of the Medice team. Can view the patient directory, manage their assigned patients, log follow-ups (*Seguimientos*), trigger Alerts, and view other volunteers' public profiles. *Cannot* create accounts or edit master hospital lists.  
* **Admin (Superuser):** Has all Volunteer privileges, plus the ability to invite new users, register/edit master patient data, manage the master list of Hospitals/Care Centers, and assign/unassign Volunteers to Patients.

### **3\. Core User Stories**

* *As an Admin*, I want to invite a new volunteer via email so that only vetted Medice members can access sensitive patient data.  
* *As a Volunteer*, I want to open my app and immediately see my assigned patients, so I know who needs a follow-up today.  
* *As a Volunteer*, I want to log a "Seguimiento" without having to re-type the patient's DNI or address, saving me time.  
* *As a Volunteer*, if I detect uncontrolled pain ("Dolor no controlado"), I want to log a High-Level Alert so that my assigned teammates receive a Push Notification immediately.  
* *As a Volunteer*, I want to see my statistics (hours volunteered, patients accompanied) over the last year to track my personal impact.

### **4\. Detailed Functional Requirements**

#### **Module A: Authentication & Onboarding**

* **Inputs:** Admin sends an invite to an Email. User clicks link, inputs Name and Password.  
* **Business Logic:** Closed ecosystem. No public sign-ups allowed to protect patient confidentiality.  
* **Outputs:** Account created, user authenticated and redirected to Main Dashboard.

#### **Module B: Main Dashboard (Volunteer Home)**

* **Processing:** Query database for Patients assigned to the active User.  
* **Outputs:**  
  * A clear list of Assigned Patients.  
  * A mini-feed under each patient showing the last logged interaction and next suggested follow-up date (*Próximo seguimiento sugerido*).

#### **Module C: Patient Directory & Search**

* **Inputs:** Search string (name, DNI), Filter parameters.  
* **Processing:** Query all active patients. Sort by active Alerts first.  
* **Outputs:** List of patients. Patients with a "Situación compleja/urgente" Alert must have a highly visible UI indicator (e.g., red borders, warning icons).

#### **Module D: "Seguimiento" Logging & Patient Detail**

* **View:** Displays Patient Master Data (Section 1\) and Caregiver Data (Section 2).  
* **Action \- Log a Follow-up (Seguimiento):**  
  * **Inputs:** Form payload covering:  
    * *Situación Actual:* Functional state, symptoms (pain, nausea, etc.), distress intensity (0-10), equipment needs.  
    * *Red Familiar:* Active network, social risk level.  
    * *Seguimiento:* Date, contact type (visit, call), needs detected, interventions, next suggested follow-up.  
  * **Processing:** Appends the log to the patient's chronological history.  
* **Action \- Trigger Alert (Alerta):**  
  * **Inputs:** Alert Level (Requiere seguimiento cercano / Situación compleja), Alert Motive (e.g., Disnea, Soledad/Abandono), Observations.  
  * **Processing:** Updates Patient status.  
  * **Outputs:** Triggers an immediate **Push Notification** to all other volunteers assigned to that specific patient (and optionally Admins).

#### **Module E: Admin Management Tools**

* **Patient-Volunteer Assignment:** Intuitive UI to select a patient and check off N volunteers (usually 2\) to assign them.  
* **Hospital Management:** CRUD (Create, Read, Update, Delete) interface to manage the fixed dropdown list of "Centros de Atención Habitual".

#### **Module F: User Profiles & Statistics**

* **Personal Stats:** Filters (1W, 1M, 1Y, Custom) showing total follow-ups done, active patients, and time spent.  
* **Public Directory:** List of all Medice volunteers showing their tenure, stats, and currently assigned patients to foster community.

### **5\. Expected Edge Cases & Error Handling**

* **Offline Mode (PWA):** If a volunteer loses internet inside a hospital, the "Seguimiento" form must cache locally and automatically sync to the database when the connection returns.  
* **Concurrent Editing:** If two users update a patient's caregiver info simultaneously, the system uses "last-write-wins" but keeps a history log.

### **6\. High-Level Data Entities**

1. **User (Volunteer/Admin):** ID, Name, Email, Role, JoinedDate.  
2. **Patient:** ID, Name, DNI, DOB, Address, Diagnosis, HospitalID, CurrentStatus (Estable/Alerta), AssignedVolunteers\[\].  
3. **Caregiver (Referente):** PatientID, Name, Relation, Phone, LivesWithPatient(Y/N), BurdenLevel.  
4. **Hospital:** ID, Name.  
5. **Event (Seguimiento):** ID, PatientID, AuthorID, Date, ContactType, Symptoms\[\], DistressScore, Needs, Interventions, AlertLevel.

### **7\. Non-Functional Requirements (NFRs)**

* **Platform:** Progressive Web App (PWA) with manifest and service workers for mobile installation and offline capabilities.  
* **Push Notifications:** Must integrate a service (e.g., Firebase Cloud Messaging) to deliver urgent alerts directly to device lock screens.  
* **UX/Accessibility (Target 40+):**  
  * Minimum 16px body text.  
  * High contrast ratios.  
  * Large, forgiving touch targets for form checkboxes (e.g., symptom selection).  
  * Use of standard, easily recognizable icons.  
* **Security:** All patient data must be encrypted at rest and in transit (HTTPS) to comply with health data privacy standards.
