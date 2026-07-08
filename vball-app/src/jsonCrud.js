const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const usersFilePath = path.join(dataDir, 'users.json');
const listsFilePath = path.join(dataDir, 'lists.json');

async function readJsonFile(filePath) {
  const fileContents = await fs.readFile(filePath, 'utf8');

  if (!fileContents.trim()) {
    return {};
  }

  return JSON.parse(fileContents);
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function readUsers() {
  const data = await readJsonFile(usersFilePath);
  return Array.isArray(data.users) ? data.users : [];
}

async function writeUsers(users) {
  await writeJsonFile(usersFilePath, { users });
}

async function createUser(user) {
  const users = await readUsers();
  const nextUsers = [...users, user];
  await writeUsers(nextUsers);
  return user;
}

async function updateUser(email, updates) {
  const users = await readUsers();
  const userIndex = users.findIndex((user) => user.email === email);

  if (userIndex === -1) {
    return null;
  }

  const updatedUser = { ...users[userIndex], ...updates };
  const nextUsers = [...users];
  nextUsers[userIndex] = updatedUser;

  await writeUsers(nextUsers);
  return updatedUser;
}

async function deleteUser(email) {
  const users = await readUsers();
  const nextUsers = users.filter((user) => user.email !== email);

  if (nextUsers.length === users.length) {
    return false;
  }

  await writeUsers(nextUsers);
  return true;
}

async function readLists() {
  const data = await readJsonFile(listsFilePath);

  return {
    'registered-users': Array.isArray(data['registered-users']) ? data['registered-users'] : [],
    'waitlist-users': Array.isArray(data['waitlist-users']) ? data['waitlist-users'] : []
  };
}

async function writeLists(lists) {
  await writeJsonFile(listsFilePath, lists);
}

async function createListEntry(listName, entry) {
  const lists = await readLists();

  if (!Object.prototype.hasOwnProperty.call(lists, listName)) {
    throw new Error(`Unknown list: ${listName}`);
  }

  const nextList = [...lists[listName], entry];
  const nextLists = { ...lists, [listName]: nextList };
  await writeLists(nextLists);
  return entry;
}

async function updateListEntry(listName, email, updates) {
  const lists = await readLists();

  if (!Object.prototype.hasOwnProperty.call(lists, listName)) {
    throw new Error(`Unknown list: ${listName}`);
  }

  const entryIndex = lists[listName].findIndex((entry) => entry.email === email);

  if (entryIndex === -1) {
    return null;
  }

  const updatedEntry = { ...lists[listName][entryIndex], ...updates };
  const nextList = [...lists[listName]];
  nextList[entryIndex] = updatedEntry;

  await writeLists({ ...lists, [listName]: nextList });
  return updatedEntry;
}

async function deleteListEntry(listName, email) {
  const lists = await readLists();

  if (!Object.prototype.hasOwnProperty.call(lists, listName)) {
    throw new Error(`Unknown list: ${listName}`);
  }

  const nextList = lists[listName].filter((entry) => entry.email !== email);

  if (nextList.length === lists[listName].length) {
    return false;
  }

  await writeLists({ ...lists, [listName]: nextList });
  return true;
}

module.exports = {
  usersFilePath,
  listsFilePath,
  readUsers,
  writeUsers,
  createUser,
  updateUser,
  deleteUser,
  readLists,
  writeLists,
  createListEntry,
  updateListEntry,
  deleteListEntry
};