import { Component, OnInit } from '@angular/core';
import { NgForm } from "@angular/forms";

export interface errorMessage {
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
interface stringVariable{
  name:string,
  value:string
}

@Component({
  selector: 'app-compiler',
  templateUrl: './compiler.component.html',
  styleUrls: ['./compiler.component.scss']
})

export class CompilerComponent implements OnInit {
  constructor() { }
  form : NgForm;
  analyserState = {
    'lexicalAnalyser':null,
    'syntaxAnalyser':null,
    'semanticAnalyser':null
  }
  inputText : string = null;

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
  outputTerminal: errorMessage[] = [];
  outputText: string[] = [];
  variables: variable[] = [];
  stringVariables: stringVariable[] = [];

  ngOnInit(): void {
  }

  onSubmit(form : NgForm){

    this.inputText = form.value.inputText;

    this.outputTerminal = [];
    this.outputText = [];
    this.variables = [];

    this.analyserState.lexicalAnalyser = this.lexicalAnalyser();
    this.syntaxAnalyser()
  }

  lexicalAnalyser(){

    let lineIndex = 1;
    let wordIndex = 1;
    let errorsCount = 0;
    let senctences : string[] = this.inputText.split('\n')

    //check for whitespace => warning
    for (let sentence of senctences){
      if ( sentence.length !== sentence.trim().length){
        sentence = sentence.trim()
        this.pushMessageToterminal(
          lineIndex,
          wordIndex,
          'warning',
          'white space trimmed'
        )
      }
      let words : string[] = sentence.split(' ')
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
    return errorsCount>0 ? false : true;

  }

  syntaxAnalyser(){

    let listOfWords = this.inputText.trim().split(/\s+/);
    let startEndCount=0;
    let wordIndex = 0;
    let lineIndex = 0;
    let senctences : string[] = this.inputText.split('\n');
    //check for whitespace => warning

    for (let wordTemp of listOfWords){
      if ( wordTemp === 'شروع'){
        startEndCount++;
      }else if (wordTemp === 'پایان'){
        startEndCount--;
      }
    }
    if( listOfWords.length === 1 && listOfWords[0] === ''){
      return
    }
    if ( (listOfWords[0]!=='') && listOfWords[0] !==  'شروع'){
      this.pushMessageToterminal(0,0,'error','No start argument found', 'شروع')

    }else if ( listOfWords[listOfWords.length -1] !== 'پایان'){
      this.pushMessageToterminal(0,0,'error','No finish argument found', 'پایان')

    }else if (startEndCount !== 0){
      this.pushMessageToterminal(
        -1,
        -1,
        'error',
        'Unmatched start and end arguments, MISSING: ' +( startEndCount>0 ? 'پایان' : 'شروع'))
    }


    for (let sentence of senctences) {
      let words: string[] = sentence.split(' ')
      for (let word of words) {
        if (word === 'عدد') {
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
          if (words.length === 1) {
            this.pushMessageToterminal(lineIndex, wordIndex, 'error', 'Provide a variable name', 'رشته')
          } else if (this.checkIsVariableName(words[wordIndex + 1])) {
            this.addVariable('string', words[wordIndex + 1])
          } else {
            this.pushMessageToterminal(lineIndex, wordIndex, 'error', 'invalid variable name', words[wordIndex + 1])
          }
        }else if ( word === '-') {

          let variableIndex = this.getVariableIndex(words[wordIndex - 1]);

          if (variableIndex !== -1) {
            //variable is defined
            if (this.checkIsNumber(words[wordIndex + 1]) && this.variables[variableIndex].type === 'number') {
              //variable is of type number
            } else if (this.checkIsString(words[wordIndex + 1]) && this.variables[variableIndex].type === 'string') {
              //variable is of type string
              this.variables[variableIndex].value = words[wordIndex + 1].replace('"', '') ;
            } else {
              this.pushMessageToterminal(
                lineIndex,
                wordIndex,
                'error',
                'Type' + words[wordIndex + 1] + 'is not assignable to type ' + words[wordIndex - 1], words[wordIndex - 1])
              return false;
            }
            if (words.indexOf('+') !== -1){
              //command includes +

            let indexOfplus = words.indexOf('+');
              console.log(words[ indexOfplus + 1],words[ indexOfplus - 1]);
            if ( this.checkIsNumber(words[ indexOfplus + 1]) && this.checkIsNumber(words[indexOfplus - 1])){
              let summation: number = this.getNumericValue(words[indexOfplus -1 ]) + this.getNumericValue(words[indexOfplus + 1]);
              this.variables[variableIndex].value =  summation;
              console.log("Sum",summation)
            }else {
              this.pushMessageToterminal(
                lineIndex,
                wordIndex,
                'error',
                'Inconsistent type,' + words[indexOfplus + 1] + 'is not assignable to type ' + words[indexOfplus - 1])
            }
          } else
            this.variables[variableIndex].value = Number(words[wordIndex + 1]);

          } else {
            this.pushMessageToterminal(
              lineIndex,
              wordIndex,
              'error',
              'Undefined variable',
              words[wordIndex - 1])
          }
        } else if ( word === 'چاپ') {
          let variableIndex = this.getVariableIndex(words[wordIndex + 1]);
          if (variableIndex !== -1) {
            this.outputText.push(this.variables[variableIndex].value.toString().replace('"', ''))
          } else if (this.checkIsNumber(words[wordIndex + 1]) || this.checkIsString(words[wordIndex + 1])) {
            this.outputText.push(words[wordIndex + 1].substring(0, word.length - 1).replace('"', ''));
          } else {
            this.pushMessageToterminal(
              lineIndex,
              wordIndex,
              'error',
              'UNDEFINED TYPE' + 'Can\'t print word ',
              words[wordIndex + 1])
          }
        }
          wordIndex++;
        }
      wordIndex = 0;
    lineIndex++;
    }
    lineIndex = 0;
  }

  checkIsNumber(word:any){
    let varIndex = this.getVariableIndex(word)
    if ( varIndex !== -1 && ( this.variables[varIndex].type === 'number'))
      return true;
    else
    return isNaN ( word )? false : true;
  }

  getNumericValue( varName ){
    let varIndex: number = this.getVariableIndex(varName)
    if ( varIndex !== -1 ){
      return Number( this.variables[varIndex].value );
    }
    else return Number(varName)
  }

  // variable name must only consist of persian letters and numbers and it shoulden't start with numbers
  checkIsVariableName(word:string){
    return word.match('^['+this.regex+'_$]['+this.regex+'_$0-9]*$') ? true : false;
  }

   getVariableIndex(varName: any) {
     let varIndex = this.variables.map( (e) => e.name).indexOf(varName);
    return varIndex;
  }

  checkIsString(word){
    return (word[0] === '"' && word[word.length - 1] === '"') ? true : false;
  }

  pushMessageToterminal(line: number=-1 ,word: number=-1 , type: string, message: string,index: number|string= ''){
    this.outputTerminal.push({
      lineIndex:line,
      wordIndex: word,
      type:type,
      message:message + ( index !== '' ? " =>  " + index : '' )
    })
  }

  addVariable(type,name:string,value=0){
    this.variables.push({
      type:type,
      name:name,
      value:value
    })
  }
}
