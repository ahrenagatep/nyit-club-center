// columns of the users table sent back to the app for the signed-in user
// (register, login, verify, GET/PATCH /users/me), so every response has the same shape

const USER_COLUMNS =
  'user_id, auth_user_id, nyit_email, username, first_name, last_name, role, major, school_year, bio';

module.exports = { USER_COLUMNS };
