'use strict'

const importLazy = require('import-lazy')(require)

const inquirer = importLazy('inquirer')

module.exports = (hotTrends, savedTrends) => {
  const hotList = hotTrends.map(item => item.query)
  const savedList = savedTrends.map(item => item.query)
  if (hotList.length > 0) {
    hotList.unshift(new inquirer.Separator('- Hot Trends -'))
  }
  if (savedList.length > 0) {
    savedList.unshift(new inquirer.Separator('- Saved Trends -'))
  }
  return [{
    type: 'list',
    name: 'trends',
    message: 'Select trends',
    choices: hotList.concat(savedList),
    pageSize: 20
  }]
}
