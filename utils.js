var fs         = require('fs');

/*******************************************************************************
  function     : readFile
  paramters    : file:string
  return       : string
  description  : Sync reads a plain text file.
*******************************************************************************/
readFile = function(file){
  return fs.readFileSync(file,"utf8");
}