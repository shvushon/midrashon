const answerButtonGrid = document.getElementById('answer-buttons')

let currentQuestionIndex
let global_json = {}
let this_json = {}
let counter = 0
let fields = []
let type = []


document.getElementById('start-btn').addEventListener('click', startGame)
document.getElementById("restart").addEventListener('click', restartGame)
document.getElementById("next-question-btn").addEventListener('click', nextQuestion)

function initGame()
{
  this_json = {}
  counter = 0
}

function hide(id)
{
  document.getElementById(id).classList.add("hide")
}

function show(id) 
{
  document.getElementById(id).classList.remove("hide")
}

function allEqual(arr)
{
  if (arr.length != 13)
    return -1;
  for (let i = 0; i < arr.length; i++)
  {
    if (arr[i] !== arr[0])
      return -1;
  }
  return arr[0]
}

function startGame() {
  show('loading-container')
  hide('start-container')
  const csv_url = 'https://raw.githubusercontent.com/shvushon/midrashon/master/midrashon.csv'
  getDataFromURL(csv_url).then(csv => {
    var json = csvToJSON(csv)
    global_json = json
    fields = Object.keys(json["מגדל עוז"])

    currentQuestionIndex = 0
    
    hide('loading-container')
    show('start-question')
    setNextQuestion()
  })
}

function nextQuestion()
{
  for (var i = 0; i < 5; i++)
  {
    type.push(document.getElementById('cb' + i).checked)
  }
  hide('start-question')
  show('questions-container')
}

function restartGame()
{
  hide('results-container')
  initGame()
  startGame()
  for (var i = 0; i < 5; i++)
  {
    document.getElementById('cb' + i).checked = false
  }
}

function setNextQuestion() {
  resetState()
  showQuestion(fields[currentQuestionIndex])
}

function showQuestion(question) {
  document.getElementById('question').innerText = question
  var answers = ['לא משנה לי', 1, 2, 3, 4, 5]
  answers.forEach(answer => {
    const button = document.createElement('button')
    button.innerText = answer
    button.classList.add('btn')
    button.addEventListener('click', selectAnswer)
    answerButtonGrid.appendChild(button)
  })
}

function resetState() {
  while (answerButtonGrid.firstChild) {
    answerButtonGrid.removeChild(answerButtonGrid.firstChild)
  }
}

function selectAnswer(e) {
  const selectedButton = e.target
  let field = fields[counter]
  counter++
  if (selectedButton.innerHTML !== "לא משנה לי")
  {
    this_json[field] = parseInt(selectedButton.innerHTML)
  }
  if (fields.length > currentQuestionIndex + 6) {
    currentQuestionIndex++
    setNextQuestion()
  } else {
    finishGame()
  }
}

async function getDataFromURL(url){
  const response = await fetch(url, {})
  return response.text()
}

function csvToJSON(csvStr){
  const csvData = csvStr.split("\n").map(function(row){return row.split(",")})

  var result = {}

  const fields = csvData[0]
  const yeshivot = csvData.map(function(value,index) { return value[0] })

  for (var i = 1; i < yeshivot.length - 1; i++) {
    var tmpDict = {}
    for (var j = 1; j < fields.length; j++) {
      tmpDict[fields[j]] = parseFloat(csvData[i][j])
    }
    result[yeshivot[i]] = tmpDict
  }
  
  fields.shift()
  yeshivot.shift()
  yeshivot.pop()

  return result
}

function valueInArr(arr, value)
{
  for (var i of arr)
  {
    if (value[0] === i[0])
      return true
  }
  return false
}

function filterByType(items)
{
  var new_items = []
  const dict = ['לפני שירות','אחרי שירות/צבא','לפני צבא','שילוב שירות','שילוב אקדמיה']  
  for (var i = 0; i < items.length; i++)
  {
    var tmp_type = []
    for (var j = 0; j < dict.length; j++)
    {
      tmp_type.push(global_json[items[i][0]][dict[j]] === '1')
    }
    for (var j = 0; j < tmp_type.length; j++)
    {
      if (tmp_type[j] === type[j] === true)
      {
        new_items.push(items[i])
        break
      }
    }
  }
  return new_items
}

function getResults()
{
  var result = {}
  for (var i in global_json)
  {
    if (i === 'משקל')
      continue;
    var sum = 0
    for (var j in this_json)
    {
      if (global_json['משקל'][j] === 0)
        sum += Math.abs(5 - global_json[i][j]) * this_json[j]
      else if (this_json[j] === 1 || this_json[j] === 5)
        sum += Math.abs(this_json[j] - global_json[i][j]) * (global_json['משקל'][j] + 1)
      else
        sum += Math.abs(global_json[i][j] - this_json[j]) * global_json['משקל'][j]
    }
    result[i] = sum
  }

  var items = Object.keys(result).map(function(key) {
    return [key, result[key]];
  });
  
  items = filterByType(items)

  items.sort(function(first, second) {
    return first[1] - second[1];
  });
  
  const zero_percent = items[items.length - 1][1]

  if (zero_percent === 0)
    return false;
  
  var results_arr = []
  
  for (var i = 0; i < 3; i++) {
        results_arr.push([items[i][0], 100 * (1 - items[i][1]/zero_percent)])
  }
  console.log(results_arr)
  return results_arr
}

function sum(array) {
  return array.reduce((a, b) => a + b, 0)
}

function writeOneResult(text)
{
  document.getElementById("res0").innerHTML = "#1 - " + text + " (100% התאמה)"
  document.getElementById("res1").innerHTML = ''
  document.getElementById("res2").innerHTML = ''
}

function finishGame()
{
  hide('questions-container')
  var results = getResults()
  
  let numbers_values = Object.values(this_json)
  if (results === false || allEqual(numbers_values) === 1)
    writeOneResult('צבא ההגנה לישראל')
  else if ([2, 3, 4].includes(allEqual(numbers_values)))
    writeOneResult("חברון החדשה")
  else if (allEqual(numbers_values) === 5)
    writeOneResult("פוניבז'")
  else {
    for (var i = 0; i < 3; i++)
      document.getElementById("res" + i).innerHTML = `#${i + 1} - ${results[i][0]} (${(Math.sqrt(results[i][1]) * 10).toFixed(2)}% התאמה)`
  }

  show('results-container')
}