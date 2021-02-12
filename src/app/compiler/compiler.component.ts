import { Component, OnInit } from '@angular/core';
import { NgForm } from "@angular/forms";

interface errorMessage {
  lineIndex:number;
  wordIndex:number
  type:string;
  message:string;
}

interface variable{
  type:'string'|'number';
  name:string,
  value:number | string;
}

@Component({
  selector: 'app-compiler',
  templateUrl: './compiler.component.html',
  styleUrls: ['./compiler.component.scss']
})

export class CompilerComponent implements OnInit {
  constructor() {}

  analyserState = {
    'lexicalAnalyser':null,
    'syntaxAnalyser':null,
    'semanticAnalyser':null
  }
//regex to match persian letters
  regex = '\u0621-\u0628\u062A-\u063A\u0641-\u0642\u0644-\u0648\u064E-\u0651\u0655\u067E\u0686\u0698\u06A9\u06AF\u06BE\u06CC';

  reservedWords: string[] = [
    'شروع',
    'پایان',
    'چاپ',
    'تکرار',
    'عملیات',
    'عدد',
    'رشته',
    '+',
    '=',
    '-'
  ]


  terminalMessages: errorMessage[] = [];
  outputResults: string[] = [];
  generatedVariables: variable[] = [];
  //sentences is an array that contains each line of input as a string
  sentences : string[];

  //contains all input words, separated by whitespace (space or new line)
  listOfWords: string[];

  ngOnInit(): void {}

  onSubmit(form : NgForm){

    this.sentences = form.value.inputText.split('\n');
    this.listOfWords = form.value.inputText.trim().split(/\s+/);

    //Emptying arrays that contain data from previous compiles
    this.terminalMessages = [];
    this.outputResults = [];
    this.generatedVariables = [];

    this.analyserState.lexicalAnalyser = this.lexicalAnalyser();
    this.syntaxAnalyser()
  }

  lexicalAnalyser(){

    let lineIndex = 1;
    let wordIndex = 1;

    //used to count the number of start and end arguments
    let errorsCount = 0;

    //looping through each sentence of input
    for (let sentence of this.sentences){

      //check for whitespace => warning
      if ( sentence.length !== sentence.trim().length)
        {
          sentence = sentence.trim()
          this.pushMessageToterminal(
            lineIndex,
            wordIndex,
            'warning',
            'white space trimmed' )
        }

      let words : string[] = sentence.split(' ')

      //looping through each word of every sentence
      for (let word of words){
        if (this.reservedWords.indexOf(word) === -1){
          //if the word is not in the reserved words array
          if (this.checkIsNumber(word)){
            // If its not reserved, is it a number, like :123
          }
          else if (this.checkIsVariableName(word)){
            //if its not reserved or number, is it a variable name
          }
          else if (this.checkIsString(word)){
            // if its not reserved, a number or a variable name is it a string like "متن"
          } else {
            //if its not any of the above then its an Unknown word
            this.pushMessageToterminal(
              lineIndex,
              wordIndex,
              'error',
              'Unknown word',
              word)
            errorsCount++;
          }
        }
        wordIndex++;
      }
      wordIndex = 0;
      lineIndex++;
    }
    lineIndex = 0;
    //If the number of errors is more than 0 return false, meaning process halted during lexical analyzing phase
    return errorsCount>0 ? false : true;
  }

  syntaxAnalyser(){

    let startEndCount=0;
    let wordIndex = 0;
    let lineIndex = 0;

    //count the number of start and end arguments,
    for (let wordTemp of this.listOfWords)
      {
        if ( wordTemp === 'شروع'){
          startEndCount++;
        }else if (wordTemp === 'پایان'){
          startEndCount--;
        }
      }
    //if input is empty return
    if ( this.listOfWords.length === 1 && this.listOfWords[0] === ''){
      return
    }

    //if input is not empty and it doesn't start with start argument, throw an error
    if ( (this.listOfWords[0]!=='') && this.listOfWords[0] !==  'شروع'){
      this.pushMessageToterminal(0,0,'error','No start argument found', 'شروع')
    //if input is not empty and it doesn't end with finish argument, throw an error
    }else if ( this.listOfWords[this.listOfWords.length -1] !== 'پایان'){
      this.pushMessageToterminal(0,0,'error','No finish argument found', 'پایان')
    //if there are no problems with start and end, check the balance between start and end, they must be equal
    }else if (startEndCount !== 0){
      this.pushMessageToterminal(
        -1,
        -1,
        'error',
        'Unmatched start and end arguments, MISSING: ' +( startEndCount>0 ? 'پایان' : 'شروع'))
    }

    //loop through each sentence of input
    for (let sentence of this.sentences) {

      let words: string[] = sentence.trim().split(' ')
      //loop through each word of every sentence
      for (let word of words) {

        if ( word === 'شروع' || word==='پایان'){

        }else if (word === 'عدد') {
          //if a variable name is not provided after this command, throw an error
          if (words.length === 1) {
            this.pushMessageToterminal(lineIndex, wordIndex, 'error', 'Provide a variable name', 'عدد')
          } else if (words.length > 0) {
            if (this.checkIsVariableName(words[wordIndex + 1])) {
              this.addVariable('number', words[wordIndex + 1])
            } else {
              this.pushMessageToterminal(lineIndex, wordIndex, 'error', 'invalid variable name', words[wordIndex + 1])
            }
          }
        } else if (word === 'رشته') {
          //if a variable name is not provided after this command, throw an error
          if (words.length === 1) {
            this.pushMessageToterminal(lineIndex, wordIndex, 'error', 'Provide a variable name', 'رشته')
          } else if (this.checkIsVariableName(words[wordIndex + 1])) {
            this.addVariable('string', words[wordIndex + 1])
          } else {
            this.pushMessageToterminal(lineIndex, wordIndex, 'error', 'invalid variable name', words[wordIndex + 1])
          }
        }
        else if ( word === '-') {

          let variableIndex = this.getVariableIndex(words[wordIndex - 1]);

          if (variableIndex !== -1) {
            //the variable that we are trying to assign a value to it, is defined
            if (words.indexOf('+') !== -1){
              //command includes +
              let indexOfplus = words.indexOf('+');
              if ( this.checkIsNumber(words[ indexOfplus + 1]) && this.checkIsNumber(words[indexOfplus - 1])){
                //arguments on both sides of + are numbers
                let summation: number = this.getNumericValue(words[indexOfplus -1 ]) + this.getNumericValue(words[indexOfplus + 1]);
                this.generatedVariables[variableIndex].value =  summation;
                console.log("FU summation")
              }else {
                //arguments on both sides of + are not numbers
                this.pushMessageToterminal(
                  lineIndex,
                  wordIndex,
                  'error',
                  'Inconsistent type,' + words[indexOfplus + 1] + 'is not assignable to type ' + words[indexOfplus - 1])
              }
              lineIndex++;
            } else {
              //command does not include +
              if (this.checkIsNumber(words[wordIndex + 1]) && this.generatedVariables[variableIndex].type === 'number') {
                this.generatedVariables[variableIndex].value = words[wordIndex + 1]
                //variable is of type number
              } else if (this.checkIsString(words[wordIndex + 1]) && this.generatedVariables[variableIndex].type === 'string') {
                //variable is of type string
                this.generatedVariables[variableIndex].value = (words[wordIndex + 1].substring(1, words[wordIndex + 1].length - 1)).toString();
                console.log("@@", this.generatedVariables[variableIndex], "sdf", words[wordIndex + 1].substring(1, words[wordIndex + 1].length - 1))
              } else {
                this.pushMessageToterminal(
                  lineIndex,
                  wordIndex,
                  'error',
                  'Type' + words[wordIndex + 1] + 'is not assignable to type ' + words[wordIndex - 1], words[wordIndex - 1])
                return false;
              }
            }
          } else {
            // word behind - is not a valid variable
            this.pushMessageToterminal(
              lineIndex,
              wordIndex,
              'error',
              'undefined variable',
              words[wordIndex -1 ])
          }

        } else if ( word === 'چاپ') {
          let variableIndex = this.getVariableIndex(words[wordIndex + 1]);
          if (variableIndex !== -1) {
            console.log(this.generatedVariables[variableIndex])
            this.outputResults.push(this.generatedVariables[variableIndex].value.toString())
          } else if (this.checkIsString(words[wordIndex + 1])) {
            this.outputResults.push(words[wordIndex + 1].substring(1, words[wordIndex + 1].length - 1).replace('"', ''));
          } else if (this.checkIsNumber(words[wordIndex + 1]) ){
            this.outputResults.push(words[wordIndex + 1]);
          }
          else {
            this.pushMessageToterminal(
              lineIndex,
              wordIndex,
              'error',
              'UNDEFINED TYPE' + 'Can\'t print word ',
              words[wordIndex + 1])
          }
        } else {
          this.pushMessageToterminal(
            lineIndex,
            wordIndex,
            'error',
            'UNDEFINED situation ( ͠ಠ ͜ʖ͠ಠ ) 👉 ' + 'wtf is ',
            word)
        }
          wordIndex++;
        }
      wordIndex = 0;
    lineIndex++;
    }
    lineIndex = 0;
  }
//check if in the generatedVariables array there is a variable name with the given name (word) and its type is number
// if there is no such variable checks if its a number like 123 or a string like "this"
  checkIsNumber(word:any){
    let varIndex = this.getVariableIndex(word)
    if ( varIndex !== -1 && ( this.generatedVariables[varIndex].type === 'number'))
      return true;
    else
    return isNaN ( word )? false : true;
  }

  //if there is a variable with given name in generatedVariables array returns its value, otherwise returns converts input to number and returns
  //notice, this function doesn't check if the type of variable is number, only use after checkIsNumber function
  getNumericValue( varName ){
    let varIndex: number = this.getVariableIndex(varName)
    if ( varIndex !== -1 ){
      return Number( this.generatedVariables[varIndex].value );
    }
    else return Number(varName)
  }

  // variable name must only consist of persian letters and numbers and it shoulden't start with numbers
  checkIsVariableName(word:string){
    return word.match('^['+this.regex+'_$]['+this.regex+'_$0-9]*$') ? true : false;
  }
  //returns the index of a variable in generatedVariables array, using its name
   getVariableIndex(varName: any) {
     let varIndex = this.generatedVariables.map( (e) => e.name).indexOf(varName);
     return varIndex;
  }
  //only checks if the string starts and ends with double quotation sign ( " )
  checkIsString(word){
    return (word[0] === '"' && word[word.length - 1] === '"') ? true : false;
  }

  //-1 is an indication for html section to " don't print the line number and word number), its handeled in html file
  //type is either 'error' that will be displayed with bootstrap danger class, or 'warning' that will be displayed with bootstrap warning class
  pushMessageToterminal(line: number=-1 ,word: number=-1 , type: string, message: string,index: number|string= ''){
    this.terminalMessages.push({
      lineIndex:line,
      wordIndex: word,
      type:type,
      message:message + ( index !== '' ? " =>  " + index : '' )
    })
  }
//adds a new variable to the generatedVariables array
  addVariable(type,name:string,value=0){
    this.generatedVariables.push({
      type:type,
      name:name,
      value:value
    })
  }
}
