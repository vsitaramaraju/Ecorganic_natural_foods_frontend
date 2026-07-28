# Frontend Integration Testing Guide - Forgot Password Feature

## Overview
This document provides step-by-step instructions to test the forgot password feature implementation.

## Prerequisites
- Backend API running on `http://localhost:5000/api`
- Frontend running on development server
- Valid test email address configured in backend
- Resend package properly configured in backend

---

## Testing Checklist

### Test 1: Forgot Password Request
**Step 1:** Navigate to `/forgot-password` page
- [ ] Page loads successfully
- [ ] Email input field is visible
- [ ] "Send Reset Link" button is present
- [ ] "Sign In" link is visible

**Step 2:** Submit with invalid email
- [ ] Try submitting empty email → Shows "Email is required"
- [ ] Try submitting invalid format → Shows "Invalid email address"

**Step 3:** Submit with valid email
- [ ] Enter a test email (e.g., test@example.com)
- [ ] Click "Send Reset Link" button
- [ ] Button shows "Sending Link…" state
- [ ] Success page appears with:
  - [ ] Email icon emoji
  - [ ] "Check Your Email" heading
  - [ ] Confirmation of email address
  - [ ] 1-hour expiration warning
  - [ ] "Send Another Link" button
  - [ ] "Back to Sign In" link

**Step 4:** Verify email received
- [ ] Check test email inbox for reset link
- [ ] Email subject: "Password Reset Request - Eco Organic Natural Foods"
- [ ] Email contains reset link with token parameter
- [ ] Link format: `http://yourfrontend.com/reset-password?token=xxxxx`

---

### Test 2: Invalid/Expired Token
**Step 1:** Navigate to reset page with invalid token
- [ ] Go to `/reset-password?token=invalid_token_here`
- [ ] Shows loading state briefly ("Verifying Link…")
- [ ] Displays "Link Invalid or Expired" message
- [ ] Shows error message from backend
- [ ] "Request New Reset Link" button links back to forgot-password page

**Step 2:** Wait for token to expire (simulated)
- [ ] If backend has a short expiration for testing, wait it out
- [ ] Try using the same reset link again
- [ ] Should show expired token error

---

### Test 3: Valid Token - Password Reset
**Step 1:** Click valid reset link from email
- [ ] Link opens `/reset-password?token=valid_token`
- [ ] Shows "Verifying Link…" loading state
- [ ] After verification, shows "Set New Password" form

**Step 2:** Form validation - empty password
- [ ] Leave password field empty
- [ ] Click "Reset Password" button
- [ ] Shows "Password is required" error

**Step 3:** Form validation - password too short
- [ ] Enter password with < 6 characters (e.g., "123")
- [ ] Shows "Min 6 characters" error

**Step 4:** Form validation - passwords don't match
- [ ] Enter password: "newPassword123"
- [ ] Enter confirm password: "differentPass123"
- [ ] Click "Reset Password"
- [ ] Shows "Passwords do not match" error

**Step 5:** Form validation - success
- [ ] Enter valid password: "newPassword123"
- [ ] Enter same confirm password: "newPassword123"
- [ ] Click "Reset Password" button
- [ ] Button shows "Resetting…" state
- [ ] Wait for response

---

### Test 4: Successful Password Reset
**Step 1:** After successful password update
- [ ] Success page appears with:
  - [ ] Checkmark emoji (✅)
  - [ ] "Password Reset Successfully!" heading
  - [ ] Success message in green
  - [ ] "Redirecting to login page in a few seconds..." message
  - [ ] "Go to Login" button

**Step 2:** Automatic redirect
- [ ] Page automatically redirects to `/login` after 3 seconds
- [ ] Or user can click "Go to Login" button to redirect immediately

**Step 3:** Login with new password
- [ ] Navigate to login page
- [ ] Enter email and new password
- [ ] Should be able to log in successfully
- [ ] Confirm old password no longer works (try logging out and back in with old password)

---

### Test 5: Token Reuse Prevention
**Step 1:** Try using same token twice
- [ ] Copy the valid reset link from first successful reset
- [ ] Log out and navigate to that link again
- [ ] Should show "Invalid or expired reset token" error
- [ ] User should need to request a new reset link

---

### Test 6: Email Error Handling
**Step 1:** Test non-existent email
- [ ] Go to forgot-password page
- [ ] Enter email that doesn't exist in database (e.g., notauser@example.com)
- [ ] Should show "User not found with this email" error
- [ ] Button shows "Send Reset Link…" then reverts to normal
- [ ] User can try again

**Step 2:** Test error handling
- [ ] Stop backend server temporarily
- [ ] Try requesting reset link
- [ ] Should show "Could not send reset link. Please try again." error
- [ ] User can retry once backend is back

---

### Test 7: Browser Back Navigation
**Step 1:** During success page
- [ ] After successful reset, before redirect
- [ ] Click browser back button
- [ ] Should go back to login or previous page
- [ ] Redirecting message should not interfere

**Step 2:** During reset form
- [ ] On reset password form with valid token
- [ ] Click browser back button
- [ ] Should go back to previous page
- [ ] Token should still be valid if user returns

---

### Test 8: CORS & Network Issues
**Step 1:** Test CORS handling
- [ ] Verify frontend and backend run on correct URLs
- [ ] Check network tab in browser DevTools
- [ ] No CORS errors should appear
- [ ] All requests should have correct headers

**Step 2:** Slow network simulation
- [ ] Use Chrome DevTools Network tab
- [ ] Set to "Slow 3G" or similar
- [ ] Test forgot password request
- [ ] Loading states should display correctly
- [ ] Button should remain disabled during loading

---

## Network Request Verification

### Expected Request 1: Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "message": "Password reset link sent to your email",
  "success": true
}

Response (400):
{
  "message": "User not found with this email"
}
```

### Expected Request 2: Verify Token
```
POST /api/auth/verify-reset-token
Content-Type: application/json

{
  "token": "reset_token_from_url"
}

Response (200):
{
  "message": "Reset token is valid",
  "valid": true
}

Response (400):
{
  "message": "Invalid or expired reset token",
  "valid": false
}
```

### Expected Request 3: Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_url",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}

Response (200):
{
  "message": "Password reset successfully",
  "success": true
}

Response (400):
{
  "message": "Invalid or expired reset token"
}
```

---

## Debugging Tips

### Issue: "Cannot POST /api/auth/forgot-password"
- [ ] Check backend is running on http://localhost:5000
- [ ] Verify endpoint path is correct in backend
- [ ] Check CORS configuration in backend

### Issue: "Email not received"
- [ ] Verify Resend API key is set in backend
- [ ] Check sender email is verified in Resend dashboard
- [ ] Look for rate limiting issues
- [ ] Check spam/junk folder

### Issue: "Cannot read token from URL"
- [ ] Verify email link includes ?token= parameter
- [ ] Check browser console for errors
- [ ] Test with manually constructed URL

### Issue: Blank form after token verification
- [ ] Check browser console for JavaScript errors
- [ ] Verify CSS is loading (check Network tab in DevTools)
- [ ] Check if API response is being received correctly

### Issue: Stuck on "Verifying Link..." screen
- [ ] Open browser DevTools Network tab
- [ ] Check if /verify-reset-token request completed
- [ ] Look for any error responses
- [ ] Check if backend is responding

---

## Browser DevTools Inspection

### Console Errors to Check For:
```javascript
// Should not see any of these:
- "CORS error"
- "Unexpected token in JSON"
- "Cannot read property of undefined"
- "Fetch failed"
```

### Network Tab Inspection:
1. Look for `/auth/forgot-password` request
   - Status: 200 (success) or 400 (error)
   - Response contains expected JSON

2. Look for `/auth/verify-reset-token` request
   - Status: 200 with valid: true/false
   - Timing: Usually instant

3. Look for `/auth/reset-password` request
   - Status: 200 (success) or 400 (error)
   - Check response time

---

## Complete User Flow Test Script

```
1. START: Go to http://localhost:3000/forgot-password
   ✓ Page loads with email input
   
2. ACTION: Enter test@example.com, click "Send Reset Link"
   ✓ Success page appears with email confirmation
   
3. ACTION: Check email inbox, click reset link
   ✓ Link opens reset-password page with token in URL
   ✓ Page shows "Verifying Link..." then form
   
4. ACTION: Enter new password "SecurePass123", confirm, click "Reset Password"
   ✓ Success screen appears
   ✓ Automatically redirects to login after 3 seconds
   
5. ACTION: Go to http://localhost:3000/login
   ✓ Login page appears
   
6. ACTION: Enter test@example.com and SecurePass123, click login
   ✓ Successfully logs in
   ✓ Redirected to dashboard/home page
   
7. VERIFY: Confirm session is active with new password
   ✓ User is authenticated
   ✓ Can access protected routes
```

---

## Pass/Fail Criteria

### Must Pass ✅
- [ ] Email validation works
- [ ] Reset link is sent and received
- [ ] Token verification works
- [ ] Valid token shows password form
- [ ] Invalid token shows error
- [ ] Password validation works
- [ ] Passwords can be reset
- [ ] User can login with new password
- [ ] Token reuse is prevented

### Should Pass ✅
- [ ] All loading states display
- [ ] Error messages are clear
- [ ] Buttons disable during loading
- [ ] Forms validate in real-time
- [ ] Success messages appear

### Optional Nice-to-Have ✅
- [ ] Password strength indicator
- [ ] Show/hide password toggle
- [ ] Email suggestions on typo
- [ ] Copy email button on success page

---

## Signoff Checklist
- [ ] All tests passed
- [ ] No console errors
- [ ] No network errors
- [ ] Feature works end-to-end
- [ ] Ready for production

