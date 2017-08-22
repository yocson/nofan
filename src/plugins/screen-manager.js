'use strict'

var _ = require('lodash')
var stripAnsi = require('strip-ansi')
var stringWidth = require('string-width')
var util = require('inquirer/lib/utils/readline')
const ScreenManager = require('inquirer/lib/utils/screen-manager')

function height (content) {
  return content.split('\n').length
}

function lastLine (content) {
  return _.last(content.split('\n'))
}

ScreenManager.prototype.render = function (content, bottomContent) {
  this.rl.output.unmute()
  this.clean(this.extraLinesUnderPrompt)

  /**
   * Write message to screen and setPrompt to control backspace
   */

  var promptLine = lastLine(content)
  var rawPromptLine = stripAnsi(promptLine)

  // Remove the rl.line from our prompt. We can't rely on the content of
  // rl.line (mainly because of the password prompt), so just rely on it's
  // length.
  var prompt = promptLine
  if (this.rl.line.length) {
    prompt = prompt.slice(0, -this.rl.line.length)
  }
  this.rl.setPrompt(prompt)

  // setPrompt will change cursor position, now we can get correct value
  var cursorPos = this.rl._getCursorPos()
  var width = this.normalizedCliWidth()

  content = forceLineReturn(content, width)
  if (bottomContent) {
    bottomContent = forceLineReturn(bottomContent, width)
  }
  // Manually insert an extra line if we're at the end of the line.
  // This prevent the cursor from appearing at the beginning of the
  // current line.
  if (rawPromptLine.length % width === 0) {
    content += '\n'
  }
  var fullContent = content + (bottomContent ? '\n' + bottomContent : '')
  this.rl.output.write(fullContent)

  /**
   * Re-adjust the cursor at the correct position.
   */

  // We need to consider parts of the prompt under the cursor as part of the bottom
  // content in order to correctly cleanup and re-render.
  var promptLineUpDiff = Math.floor(rawPromptLine.length / width) - cursorPos.rows
  var bottomContentHeight = promptLineUpDiff + (bottomContent ? height(bottomContent) : 0)
  if (bottomContentHeight > 0) {
    util.up(this.rl, bottomContentHeight)
  }

  // Reset cursor at the beginning of the line
  util.left(this.rl, stringWidth(lastLine(fullContent)))

  // Adjust cursor on the right
  util.right(this.rl, cursorPos.cols)

  /**
   * Set up state for next re-rendering
   */
  this.extraLinesUnderPrompt = bottomContentHeight
  this.height = height(fullContent)

  this.rl.output.mute()
}

function breakLines (lines, width) {
  // Break lines who're longuer than the cli width so we can normalize the natural line
  // returns behavior accross terminals.
  var regex = new RegExp(
    '(?:(?:\\033[[0-9;]*m)*.?){1,' + width + '}',
    'g'
  )
  return lines.map(function (line) {
    var chunk = line.match(regex)
    // last match is always empty
    chunk.pop()
    return chunk || ''
  })
}

function forceLineReturn (content, width) {
  return _.flatten(breakLines(content.split('\n'), width)).join('\n')
}

module.exports = ScreenManager
