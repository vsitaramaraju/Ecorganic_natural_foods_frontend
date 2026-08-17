import API from "./axios";

/**
 * Contact Form API Functions
 * Handles all contact form related API calls
 */

/**
 * Submit a contact form
 * @param {Object} contactData - Contact form data
 * @param {string} contactData.name - Customer's name
 * @param {string} contactData.email - Customer's email
 * @param {string} contactData.subject - Message subject
 * @param {string} contactData.message - Message content
 * @returns {Promise<{message: string, success: boolean}>}
 */
export const submitContactForm = (contactData) => {
  return API.post("/contact/submit", contactData);
};

export default {
  submitContactForm
};
