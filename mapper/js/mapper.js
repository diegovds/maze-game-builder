var mainCanvas;
var mainCtx;

var bgCanvas;
var bgCtx;

var bgWidth;
var bgHeight;

var image;

var test

var bgImg;
var bgSrc = 'bg_ufsm.jpg';
var tilesImg;
var tilesSrc = 'tiles.png';
var pegmanImg;
var pegmanSrc = 'pegman.png';
var markerImg;
var markerSrc = 'marker.png';
var loadingStatus = [ false, false, false, false ];

var isGridActivated = true;
var gridColor = "red";

var squareSize = 50;

var levels = [];
var levelHeight;
var levelWidth;
var currentLevel;

var shapes = {
  '10010': [4, 0],  // Dead ends
  '10100': [3, 3],
  '11000': [0, 1],
  '10001': [0, 2],
  '11010': [4, 1],  // Vertical
  '10101': [3, 2],  // Horizontal
  '10011': [0, 0],  // Elbows
  '10110': [2, 0],
  '11100': [4, 2],
  '11001': [2, 3],
  '11011': [1, 1],  // Junctions
  '10111': [1, 0],
  '11110': [2, 1],
  '11101': [1, 2],
  '11111': [2, 2],  // Cross
  'null0': [4, 3],  // Empty
  'null1': [3, 0],
  'null2': [3, 1],
  'null3': [0, 3],
  'null4': [1, 3]
};

var matrices;

function initBGCanvas()
{
	var dpr = window.devicePixelRatio || 1;

	bgCanvas = document.getElementById( "bgCanvas" );

	bgCanvas.style.height = bgHeight + "px";
	bgCanvas.style.width = bgWidth + "px";
	
	bgCanvas.width = bgWidth * dpr;
	bgCanvas.height = bgHeight * dpr;
	
	bgCtx = bgCanvas.getContext( '2d' );
	bgCtx.scale( dpr, dpr );

	bgCtx.imageSmoothingEnabled = false;
}

function initMainCanvas()
{
	var dpr = window.devicePixelRatio || 1;

	mainCanvas = document.getElementById( "mainCanvas" );
	mainCanvas.addEventListener( "mouseup", clickChangeTile, true );

	mainCanvas.oncontextmenu = function(){ return false; };

	mainCanvas.style.height = bgHeight + "px";
	mainCanvas.style.width = bgWidth + "px";

	mainCanvas.width = bgWidth * dpr;
	mainCanvas.height = bgHeight * dpr;

	mainCtx = mainCanvas.getContext( '2d' );
	mainCtx.scale( dpr, dpr );
	
	mainCtx.imageSmoothingEnabled = false;
}

function initLevels()
{
  currentLevel = 1;

	levelHeight = Math.floor( bgHeight / squareSize );
  levelWidth = Math.floor( bgWidth / squareSize );

  var matrix = [];
  var row = [];
  for ( var i = 0; i < levelWidth; i++ )
  {
      row.push( 0 );
  }
  for ( var j = 0; j < levelHeight; j++ )
  {
      matrix.push( row.concat() );
  }

	var toolbar = document.getElementById( "toolbar" );

  var addLevelButton = document.getElementById( "addLevel" );
  addLevelButton.style.display = "inline-block";

  var removeLevelButton = document.getElementById( "removeLevel" );
  removeLevelButton.style.display = "inline-block";

  levels = [];
	levels.push( matrix );

  var pageButtons = toolbar.childNodes;
  while( addLevelButton.previousElementSibling != null )
  {
    toolbar.removeChild( addLevelButton.previousElementSibling );
  }

  var span = document.createElement( "SPAN" );
  var node = document.createElement( "A" );

  var textnode = document.createTextNode( currentLevel );
  node.appendChild( textnode );
  span.appendChild( node );

  toolbar.insertBefore( span, document.getElementById( "addLevel" ) );
  span.setAttribute( "class", "page" );
  span.onclick = function()
  {
      var pages = toolbar.childNodes;

      for( var p = 0; p < pages.length; p++ )
      {
        if( pages[ p ].className == "page selected" )
        {
          pages[ p ].classList.remove( "selected" );
        }
      }
      currentLevel = parseInt( this.firstChild.innerHTML, 10 );
      this.classList.add( "selected" );

      refreshMainCanvas();
      refreshTextArea();
  };
  toolbar.firstElementChild.classList.add( "selected" );

  refreshTextArea();
}

function normalize( x, y )
{
	var matrix = levels[ currentLevel - 1 ];
    if( x < 0 || x >= levelWidth || y < 0 || y >= levelHeight )
    {
      return '0';
    }
    return ( matrix[ y ][ x ] == 0 ) ? '0' : '1';
};

function areImagesLoaded()
{
  return loadingStatus.every( function( array )
  {
    return array;
  } );
}

function loadPage()
{
  const urlSearchParams = new URLSearchParams(window.location.search)
  const userId = urlSearchParams.get("userId")
  const errorPage = document.querySelector('.errorPage')

  if(userId === null){
    //console.log(userId)
    errorPage.style.display = 'flex'
  }

  tilesImg = document.getElementById( "tilesImg" );
	pegmanImg = document.getElementById( "pegmanImg" );
  markerImg = document.getElementById( "markerImg" );

  loadingStatus[ 1 ] = true;
  loadingStatus[ 2 ] = true;
  loadingStatus[ 3 ] = true;
}

function refreshMainCanvas()
{
	mainCtx.clearRect ( 0 , 0 , bgWidth , bgHeight );
  drawTiles();
  drawGrid();
}

function drawGrid()
{
  var i = 0;
	if( isGridActivated )
	{
    mainCtx.translate( 0.5, 0.5 );
		mainCtx.lineWidth = 1;
		mainCtx.strokeStyle = gridColor;
		mainCtx.beginPath();
		for( i = squareSize; i <= bgWidth; i += squareSize )
		{
			mainCtx.moveTo( i, 0 );
			mainCtx.lineTo( i, bgHeight );
		}
		for( i = squareSize; i <= bgHeight; i += squareSize )
		{
			mainCtx.moveTo( 0, i );
			mainCtx.lineTo( bgWidth, i );
		}
		mainCtx.stroke();
	}
	mainCtx.translate( -0.5, -0.5 );
}

function refreshTextArea()
{
	var matrix = levels[ currentLevel - 1 ];
	var t = "";
	for ( var i = 0; i < levelHeight; i++ )
	{
	    for ( var j = 0; j < levelWidth; j++ )
	    {
	        t += matrix[ i ][ j ];
	        if( j < levelWidth - 1 )
        	{
        		t += " ";
        	}
	    }
	    t += "<br>";
	}
	document.getElementById("log").innerHTML = t;
}

function clickChangeTile( event )
{
	var matrix = levels[ currentLevel - 1 ];

  var rect = mainCanvas.getBoundingClientRect();
  var x = Math.floor( ( event.clientX - rect.left ) / 50 );
  var y = Math.floor( ( event.clientY - rect.top ) / 50 );

  var right = 2;
	if( event.button === right )
	{
		matrix[ y ][ x ] -= 1;
    if( matrix[ y ][ x ] < 0 ) matrix[ y ][ x ] = 3;
	}
	else
	{
		matrix[ y ][ x ] += 1;
    if( matrix[ y ][ x ] > 3 ) matrix[ y ][ x ] = 0;
	}

    refreshTextArea();
    refreshMainCanvas();
}

function clickAddLevel()
{
	var toolbar = document.getElementById( "toolbar" );
  const deleteModal = document.querySelector('.deleteModal')
  const levelError = document.querySelector("#levelError");

  const positiveOption = document.querySelector('#positiveOption')
  const titleDeleteModal = document.querySelector('.titleDeleteModal')

	if(toolbar.childNodes.length <= 20){
    var matrix = [];
    var row = [];
    for ( var i = 0; i < levelWidth; i++ )
    {
        row.push( 0 );
    }
    for ( var j = 0; j < levelHeight; j++ )
    {
        matrix.push( row.concat() );
    }
  
    levels.push( matrix );
    var span = document.createElement( "SPAN" );
    var node = document.createElement( "A" );
    var textnode = document.createTextNode( levels.length );
    node.appendChild( textnode );
    span.appendChild( node );
    toolbar.insertBefore( span, document.getElementById( "addLevel" ) );
    span.setAttribute( "class", "page" );
    span.onclick = function()
    {
        var pages = toolbar.childNodes;
  
        for( var p = 0; p < pages.length; p++ )
        {
          if( pages[ p ].className == "page selected" )
          {
            pages[ p ].classList.remove( "selected" );
          }
        }
        currentLevel = parseInt( this.firstChild.innerHTML, 10 );
        this.classList.add( "selected" );
  
        refreshMainCanvas();
        refreshTextArea();
    };
  
    currentLevel = levels.length;
  
    var pages = toolbar.childNodes;
    for( var p = 0; p < pages.length; p++ )
    {
      if( pages[ p ].className == "page selected" )
      {
        pages[ p ].classList.remove( "selected" );
      }
    }
  
    span.classList.add( "selected" );
    refreshMainCanvas();
    refreshTextArea();
  } else {
    const element = document.getElementById("levelError");
    positiveOption.style.display = 'none'
    titleDeleteModal.style.display = 'none'
    
    element.innerHTML = "Limite de níveis atingido."

    deleteModal.style.display = 'flex'
    levelError.style.display = 'flex'
  }

}

function setTest(){
  test = true

  const deleteModal = document.querySelector('.deleteModal')
  deleteModal.style.display = 'none'

  clickRemoveLevel()
}

function resetTest(){
  test = false
  
  const deleteModal = document.querySelector('.deleteModal')
  deleteModal.style.display = 'none'

  const positiveOption = document.querySelector('#positiveOption')
  positiveOption.style.display = 'flex'

  const titleDeleteModal = document.querySelector('.titleDeleteModal')
  titleDeleteModal.style.display = 'flex'

  const message = document.querySelector(".message");
  message.style.display = 'none'

  const fetchOk = document.querySelector(".fetchOk");
  fetchOk.style.display = 'none'

  const fetchError = document.querySelector(".fetchError");
  fetchError.style.display = 'none'

  const dataError = document.querySelector(".dataError");
  dataError.style.display = 'none'

  const levelError = document.querySelector("#levelError");
  levelError.style.display = 'none'

  clickRemoveLevel()
}

function switchDeleteModal(){
  if( levels.length > 1 ){
    const deleteModal = document.querySelector('.deleteModal')
    deleteModal.style.display = 'flex'
  } else {
    const deleteModal = document.querySelector('.deleteModal')
    deleteModal.style.display = 'flex'

    const positiveOption = document.querySelector('#positiveOption')
    positiveOption.style.display = 'none'

    const titleDeleteModal = document.querySelector('.titleDeleteModal')
    titleDeleteModal.style.display = 'none'

    const message = document.querySelector(".message");
    message.style.display = 'flex'
  }
}

function clickRemoveLevel()
{
  if( levels.length > 1 )
  {
    //var test = confirm( "Deseja excluir o último nível?" );

    if( test == true )
    {
      var toolbar = document.getElementById( "toolbar" );

      levels.pop();

      var lastPage = document.getElementById( "addLevel" ).previousSibling;

      if( lastPage.className == "page selected" )
      {
        lastPage.classList.remove( "selected" );
        toolbar.firstElementChild.classList.add( "selected" );
        currentLevel = 1;
      }

      toolbar.removeChild( lastPage );

      refreshMainCanvas();
      refreshTextArea();
    }
  }
  else
  {
    //alert( "Você não pode excluir o primeiro nível.");
  }

  test = false
}

function getDataURL( imageObject )
{
  imageObject.crossOrigin = 'Anonymous';
  var dpr = window.devicePixelRatio || 1;
  var temp = document.createElement( "CANVAS" );
  temp.style.width = imageObject.width;
  temp.style.height = imageObject.height;
  temp.width = imageObject.width * dpr;
  temp.height = imageObject.height * dpr;
  var tempCtx = temp.getContext( '2d' );
  tempCtx.scale( dpr, dpr );
  tempCtx.imageSmoothingEnabled = false;
  tempCtx.drawImage( imageObject, 0, 0, imageObject.width, imageObject.height );
  return temp.toDataURL( "image/png" );
}

async function clickSave()
{
  const deleteModal = document.querySelector('.deleteModal')
  const positiveOption = document.querySelector('#positiveOption')
  positiveOption.style.display = 'none'
  const titleDeleteModal = document.querySelector('.titleDeleteModal')
  titleDeleteModal.style.display = 'none'
  
  const fetchOk = document.querySelector(".fetchOk");
  const fetchError = document.querySelector(".fetchError");
  const dataError = document.querySelector(".dataError");
  const levelError = document.querySelector("#levelError");

  const buttonSave = document.querySelector('#buttonSave')
  buttonSave.style.display = 'none'
  
  const buttonSaveOff = document.querySelector('#buttonSaveOff')
  buttonSaveOff.style.display = 'inline-block'

  const urlSearchParams = new URLSearchParams(window.location.search)
  const userId = urlSearchParams.get("userId")
  //console.log(userId)

  var way = 0
  var start = 0
  var end = 0
  var item
  var levelsError = false

  var file = document.getElementById( "bgFile" );
  var name = document.getElementById( "nameMaze" ).value /* nome do jogo */
	var leveldata = JSON.stringify( levels ); /* níveis do jogo */
  image = file.files[0] /* imagem de fundo */

  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')

  canvas.width = bgWidth
  canvas.height = bgHeight

  if(bgImg){
    ctx.drawImage(bgImg, 0, 0, bgWidth, bgHeight)
    var dataurl = canvas.toDataURL();
    image = dataURLToBlob(dataurl)
    image = new File([image], file.files[0].name);
  }
  
  const data = new FormData();

  //console.log(name)
  //console.log(image)
  //console.log(leveldata)

  for (var level in levels) {
    //console.log("Nível " + level)
    way = 0
    start = 0
    end = 0
    for (var info in levels[level]){
      for (var value in levels[level][info]){
        item = levels[level][info][value]
        if(item == 1){
          way++
        }
        if(item == 2){
          start++
        }
        if(item == 3){
          end++
        }
      }
    }
    if(start != 1 || end != 1 || way < 1){
      levelsError = true

      const element = document.getElementById("levelError");
      //element.innerHTML = parseInt(level) + 1;
      element.innerHTML = "Confira se o <span>nível " + (parseInt(level) + 1) + "</span> possui um ponto de partida, um ponto de chegada e algum caminho!"

      deleteModal.style.display = 'flex'
      levelError.style.display = 'flex'

      buttonSaveOff.style.display = 'none'
      buttonSave.style.display = 'inline-block'
    }
  }

  if( levelsError == false ){
    if (name && image && leveldata){

      data.append('name', name)
      data.append('image', image)
      data.append('levels', leveldata)

      axios
        //.post("http://localhost:3333/api/mazes/" + userId, data)
        .post('https://new-api-blockly-next-prisma-postgresql.vercel.app/api/mazes/' + userId, data)
        .then((response) => {
          response = response.data.data;

          deleteModal.style.display = "flex";
          fetchOk.style.display = "flex";

          setTimeout(() => {
            window.parent.postMessage("mensagem, mazeId=" + response.id, "*");

            //window.location.assign('https://myblocklymaze.vercel.app/mazes/' + data.data.id)
          }, 2000); // aguarda 2 segundos para chamar window.location.assign()
        })
        .catch((e) => {
          deleteModal.style.display = "flex";
          fetchError.style.display = "flex";

          console.error(e);
          buttonSaveOff.style.display = "none";
          buttonSave.style.display = "inline-block";
        });
    } else{
      deleteModal.style.display = 'flex'
      dataError.style.display = 'flex'

      //alert("Confira se todos os campos foram preenchidos e se a imagem foi selecionada!")
      buttonSaveOff.style.display = 'none'
      buttonSave.style.display = 'inline-block'
    }
  }
}

function loadBackgroundFile()
{
  const deleteModal = document.querySelector('.deleteModal')
  const levelError = document.querySelector("#levelError");

  const positiveOption = document.querySelector('#positiveOption')
  const titleDeleteModal = document.querySelector('.titleDeleteModal')

  var file = document.getElementById( "bgFile" );

  var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif|\.bmp|\.webp|\.svg)$/i;

  if (!allowedExtensions.exec(file.value)) {
    //alert('Invalid file type');

    const element = document.getElementById("levelError");
    positiveOption.style.display = 'none'
    titleDeleteModal.style.display = 'none'
    
    //element.innerHTML = parseInt(level) + 1;
    element.innerHTML = "Arquivo de imagem com formato inválido!<br><br>Formatos aceitos: .jpg, .jpeg, .png, .gif, .bmp, .webp, .svg"

    deleteModal.style.display = 'flex'
    levelError.style.display = 'flex'

    file.value = '';
    return false;
  }

  bgSrc = URL.createObjectURL( file.files[0] );
  
  bgImg = new Image();
  bgImg.onload = function()
  {
    loadingStatus[ 0 ] = true;
  };
  bgImg.src = bgSrc;
}

function loadTilesFile()
{
  var file = document.getElementById( "tilesFile" );
  tilesSrc = URL.createObjectURL( file.files[0] );

  tilesImg = new Image();
  tilesImg.onload = function()
  {
    loadingStatus[ 1 ] = true;
  };
  tilesImg.src = tilesSrc;
}

function loadPegmanFile()
{
  var file = document.getElementById( "pegmanFile" );
  pegmanSrc = URL.createObjectURL( file.files[0] );

  pegmanImg = new Image();
  pegmanImg.onload = function()
  {
    loadingStatus[ 2 ] = true;
  };
  pegmanImg.src = pegmanSrc;
}

function loadMarkerFile()
{
  var file = document.getElementById( "markerFile" );
  markerSrc = URL.createObjectURL( file.files[0] );

  markerImg = new Image();
  markerImg.onload = function()
  {
    loadingStatus[ 3 ] = true;
  };
  markerImg.src = markerSrc;
}

function dataURLToBlob(dataURL) {
  var BASE64_MARKER = ';base64,';
  if (dataURL.indexOf(BASE64_MARKER) == -1) {
      var parts = dataURL.split(',');
      var contentType = parts[0].split(':')[1];
      var raw = decodeURIComponent(parts[1]);
      return new Blob([raw], {type: contentType});
  }
  var parts = dataURL.split(BASE64_MARKER);
  var contentType = parts[0].split(':')[1];
  var raw = window.atob(parts[1]);
  var rawLength = raw.length;
  var uInt8Array = new Uint8Array(rawLength);
  for (var i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], {type: contentType});
}

function drawBackground()
{
  bgHeight = 600;
  bgWidth = 700;

  initBGCanvas();

  bgCtx.drawImage( bgImg, 0, 0, bgWidth, bgHeight );
  var dataurl = bgCanvas.toDataURL();
  //console.log(dataurl)
  bgImg.src = dataurl;
  image = dataURLToBlob(dataurl)
}

function drawTiles()
{
  var matrix = levels[ currentLevel - 1 ];

  for( var x = 0; x < levelWidth; x++ )
  {
    for( var y = 0; y < levelHeight; y++ )
    {
      var tileShape = normalize( x, y ) +
      normalize( x, y - 1 ) +  // North.
      normalize( x - 1, y ) +  // West.
      normalize( x, y + 1 ) +  // South.
      normalize( x + 1, y );   // East.

      if( tileShape == '10000' ) tileShape = '11111'; // Draw cross if there's no adjacent path;
      
      if( !shapes[tileShape] )
      {
        if ( tileShape == '00000' && Math.random() > 0.3 )
        {
          tileShape = 'null0';
        }
        else
        {
          tileShape = 'null' + Math.floor( 1 + Math.random() * 4 );
        }
      }

      var left = shapes[ tileShape ][ 0 ];
      var top = shapes[ tileShape ][ 1 ];

      mainCtx.drawImage( tilesImg, left * squareSize, top * squareSize, squareSize, squareSize, x * squareSize, y * squareSize, squareSize, squareSize );
      
      if( matrix[ y ][ x ] == 2 )
      {
        mainCtx.drawImage( pegmanImg, 0, 0, 50, 50, x * squareSize + 1.5, y * squareSize - 8, 50, 50 );
      }
      if( matrix[ y ][ x ] == 3 )
      {
        mainCtx.drawImage( markerImg, 0, 0, 20, 34, x * squareSize + 15, y * squareSize - 8, 20, 34 );
      }
    }
  }
}

function clickDraw()
{
  if( loadingStatus[ 0 ] )
  {
    drawBackground();
  }
  if( loadingStatus[ 0 ] && loadingStatus[ 1 ] && loadingStatus[ 2 ] && loadingStatus[ 3 ] )
  {
    initLevels();
    initMainCanvas();

    drawTiles();

    drawGrid();
  }
}

const switchModal = () => {
  const modal = document.querySelector('.modal')
  const actualStyle = modal.style.display
  if(actualStyle == 'block') {
    modal.style.display = 'none'
  }
  else {
    modal.style.display = 'flex'
  }
}

const clickClose = () => {
  //switchModal()
  const modal = document.querySelector('.modal')
  modal.style.display = 'none'
}

const btn = document.querySelector('.buttonModal')
if(btn){
  btn.addEventListener('click', switchModal)
}

window.onclick = function(event) {
  const modal = document.querySelector('.modal')
  const checkbox = document.querySelector('input[name=grid]')
  const deleteModal = document.querySelector('.deleteModal')

  if (event.target.checked && event.target == checkbox) {
    //console.log("Checkbox is checked..");
    isGridActivated = true
  }
  if (!event.target.checked && event.target == checkbox) {
    //console.log("Checkbox is not checked..");
    isGridActivated = false
  }

  if (event.target == modal) {
    //switchModal()
    modal.style.display = 'none'
  }

  if (event.target == deleteModal) {
    deleteModal.style.display = 'none'
    resetTest()
  }
}