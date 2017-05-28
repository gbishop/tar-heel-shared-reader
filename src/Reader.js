import React, { Component } from 'react';
import { observer } from 'mobx-react';
import KeyHandler from 'react-key-handler';
import Modal from 'react-modal';

// Reader component
const ReaderContent = observer((props) => {
  const {book, pageno, width, height, top, left, store} = props;
  const fontSize = width/height < 4/3 ? width / 36 : height / 36;
  const pageStyle = {
    width, height, top, left, fontSize,
    position: 'absolute'
  }
  if (pageno > store.npages) {
    // past the end
    return (
      <div className="book-page" style={pageStyle}>
        <h1 className="title">What would you like to do now?</h1>
        <ul className="choices">
          <li><button onClick={e => store.setPage(1)}>Read this book again</button></li>
          <li><button>Read another book</button></li>
          <li><button>Go to Tar Heel Reader</button></li>
        </ul>
      </div>
    )
  }
  const page = book.pages[pageno-1];
  const textHeight = pageno === 1 ? 4 * fontSize + 8 : 6.5 * fontSize;
  const maxPicHeight = height - textHeight;
  const maxPicWidth = width;
  const verticalScale = maxPicHeight / page.height;
  const horizontalScale = maxPicWidth / page.width;
  let picStyle = {};
  if (verticalScale < horizontalScale) {
    picStyle = {
      height: maxPicHeight
    };
  } else {
    picStyle = {
      width: maxPicWidth,
      marginTop: pageno===1 ? 30 : (maxPicHeight - horizontalScale * page.height)
    }
  }
  const PageNavButtons = observer(() => {
    if (store.showPageTurn) {
      return (
        <div>
          <button className="next-link" onClick={store.nextPage}>
            <img src="/images/NextArrow.png" alt="next"/>Next
          </button>
          <button className="back-link" onClick={store.previousPage}>
            <img src="/images/BackArrow.png" alt="back"/>Back
          </button>
        </div>
      )
    } else {
      return null;
    }
  });


  if (pageno === 1) {
    let titleStyle = {
      height: 4 * fontSize,
      fontSize: 2*fontSize,
      padding: 0,
      margin: 0,
      display: 'block'
    }
    return (
      <div className="book-page" style={pageStyle}>
        <h1 className="title" style={titleStyle}>{book.title}</h1>
        <img src={"http://tarheelreader.org"+book.pages[0].url} className="pic" 
          style={picStyle} alt="" />
        <PageNavButtons />
      </div>
    );
  } else if (pageno <= book.pages.length) {
    return (
      <div className="book-page" style={pageStyle}>
        <p className="page-number">{pageno}</p>
        <img src={"http://tarheelreader.org"+page.url}
          className="pic" style={picStyle} alt=""/>
        <div className="caption-box">
          <p className="caption">{page.text}</p>
        </div>
        <PageNavButtons />
      </div>
    )
  }
})

const WordIcon = observer((props) => {
  const { word, index, iconSize, onClick, style, isFocused,
          setResponseIndex } = props;
  const aStyle = {
    display: 'inline-block',
    background: 'solid',
    textAlign: 'center',
    padding: 0,
    ...style
  };
  const iStyle = {
    width: iconSize-10
  };
  return (
    <button className="iconButton" onClick={onClick} style={aStyle}
      ref={(input) => isFocused && input && input.focus()} 
      onFocus={(e) => setResponseIndex(index)} >
      <img src={"/images/"+word+".png"} alt={word} style={iStyle} />
      <span style={{fontSize: iconSize/5}}>{word}</span>
    </button>
  )
})

const Words = observer((props) => {
  const {layout, size, vocabulary, width, height, responseIndex,
         onClick, setResponseIndex } = props;
  const nwords = vocabulary.length;
  function stepStyle(style, vary, start, end, N) {
    let styles = [];
    for(var i=0; i<N; i++) {
      let s = {...style};
      s[vary] = start + end * i / N;
      styles.push(s);
    }
    return styles;
  }

  let styles = [];
  if (layout === 'none') {
    return null;
  }
  if (layout === 'lr') {
    let half = Math.ceil(nwords / 2), ohalf = nwords - half;
    let style = {
      position: 'absolute',
      width: size
    }
    let left = stepStyle({...style, height:height/half, left:0},
                         'top', 0, height, half);

    let right = stepStyle({...style, height:height/ohalf, right:0},
                          'top', 0, height, ohalf);
    styles = left.concat(right);
  } else if (layout === 'l') {
    let style = {
      position: 'absolute',
      width: size,
      height: height/nwords,
      left:0
    };
    styles = stepStyle(style, 'top', 0, height, nwords);
  } else if (layout === 'r') {
    let style = {
      position: 'absolute',
      width: size,
      height: height/nwords,
      right:0
    };
    styles = stepStyle(style, 'top', 0, height, nwords);
  } else if (layout === 't') {
    let style = {
      position: 'absolute',
      height: size,
      width: width/nwords,
      top: 0
    };
    styles = stepStyle(style, 'left', 0, width, nwords);
  } else if (layout === 'b') {
    let style = {
      position: 'absolute',
      height: size,
      width: width/nwords,
      bottom: 0
    };
    styles = stepStyle(style, 'left', 0, width, nwords);
  }
    
  const icons = vocabulary.map((word, i) => (
    <WordIcon key={i} word={word} index={i} iconSize={size} style={styles[i]} 
      onClick={e => onClick(word)} isFocused={i === responseIndex} setResponseIndex={setResponseIndex} />
  ));
  return (<div>{icons}</div>);
})

const NRKeyHandler = observer(class NRKeyHandler extends Component {
  isDown = false;
  keyDown = (e) => {
    e.preventDefault();
    if (!this.isDown) {
      this.isDown = true;
      this.props.onKeyHandle(e);
    }
  }
  keyUp = (e) => {
    this.isDown = false;
  }
  render() {
    const keyValueList = [].concat(this.props.keyValue);
    const handlers = keyValueList.map((keyValue, i) => (
      <div key={i}>
        <KeyHandler keyEventName={'keydown'} keyValue={keyValue}
          onKeyHandle={this.keyDown} />
        <KeyHandler keyEventName={'keyup'} keyValue={keyValue}
          onKeyHandle={this.keyUp} />
      </div>
    ));
    return (<div>{handlers}</div>)
  }
})

const Controls = observer((props) => {
  const store = props.store;
  const customStyles = {
    content : {
      top                   : '50%',
      left                  : '50%',
      right                 : 'auto',
      bottom                : 'auto',
      marginRight           : '-50%',
      transform             : 'translate(-50%, -50%)'
    },
    overlay: {
      backgroundColor   : 'rgba(255, 255, 255, 0.0)'
    }
  };
  const maxSize = Math.min(store.screen.width, store.screen.height) / 4;

  return (
    <div>
      <NRKeyHandler keyValue={["ArrowRight"]}
        onKeyHandle={store.nextPage}/>
      <NRKeyHandler keyValue={["ArrowLeft"]}
        onKeyHandle={store.backPage}/>
      <NRKeyHandler keyValue={[" "]}
        onKeyHandle={store.nextResponseIndex}/>
      <NRKeyHandler keyValue="Escape"
        onKeyHandle={store.toggleControls}/>
      <Modal 
        isOpen={store.showControls} contentLabel="Reading controls"
        style={customStyles} >
        <div className="controls">
          <h1>Reading controls</h1>
          <label>Layout:&nbsp;
            <select id="layout" value={store.layout}
              onChange={e => store.layout = e.target.value}>
              <option value="none">None</option>
              <option value="l">Left</option>
              <option value="r">Right</option>
              <option value="lr">Both</option>
              <option value="t">Top</option>
              <option value="b">Bottom</option>
            </select>
          </label>
          <label>Size:&nbsp;
            <input type="range" min="50" max={maxSize} value={store.iconSize}
              onChange={e => store.setResponseSize(e.target.value)} />
          </label>
          <label>Page Navigation:&nbsp;
            <input type="checkbox" checked={store.showPageTurn}
              onChange={store.togglePageTurn} />
          </label>

          <button onClick={store.toggleControls}>Close</button>
        </div>
      </Modal>
    </div>
  );
})

const Reader = observer((props) => {
  const { store } = props;
  const book = store.book;
  let comment = '';
  const { comments, responses } = book.readings[store.reading];
  if (store.pageno <= store.npages) {
    comment = comments[store.pageno];
  }
  const commentStyle = {
    height: 20,
    fontSize: 16,
    color: '#333',
    padding:5,
    position: 'absolute',
    top: 0,
    left: 0
  };
  const commentHeight = 30;
  const containerHeight = store.screen.height - commentHeight;
  const pageStyle = {
    width: '100%',
    height: '100%'
  }
  const responseSize = store.responseSize;
  var width, height, left=0, top=0;;
  var layout = store.layout;
  if (layout === 'lr') {
    width = store.screen.width-2*responseSize;
    height = containerHeight;
    left = responseSize;
  } else if (layout === 'l') {
    width = store.screen.width-responseSize;
    height = containerHeight;
    left = responseSize;
  } else if (layout === 'r') {
    width = store.screen.width-responseSize;
    height = containerHeight;
  } else if (layout === 't') {
    height = containerHeight-responseSize;
    width = store.screen.width;
    top = responseSize;
  } else if (layout === 'b') {
    height = containerHeight-responseSize;
    width = store.screen.width;
  } else {
    height = containerHeight;
    width = store.screen.width;
  }
  const containerStyle = {
    width: store.screen.width,
    height: store.screen.height - 30,
    position: 'absolute',
    left: 0,
    top: commentHeight
  };
  const sayWord = (word) => {
    if (word) {
    } else if (store.responseIndex >= 0) {
      word = book.vocabulary[store.responseIndex];
    }
    var msg = new SpeechSynthesisUtterance(word);
    msg.lang = 'en-US';

    speechSynthesis.speak(msg);
  }
  return (
    <div style={pageStyle}>
      <div style={commentStyle}>{comment}</div>
      <div style={containerStyle}>
      <ReaderContent width={width}
        height={height}
        top={top} left={left} book={book} pageno={store.pageno} 
        store={store} />
      <Words vocabulary={responses} layout={store.layout}
        size={store.responseSize} width={store.screen.width}
        height={containerHeight} onClick={sayWord}
        responseIndex={store.responseIndex} setResponseIndex={store.setResponseIndex} />
      <Controls store={store} npages={store.npages} />
      </div>
    </div>
  );
});

export default Reader;
