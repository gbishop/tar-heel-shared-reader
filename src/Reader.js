import React, { Component } from 'react';
import { observer } from 'mobx-react';
import KeyHandler from 'react-key-handler';
import Modal from 'react-modal';
import NextArrow from './NextArrow.png';
import BackArrow from './BackArrow.png';

// Reader component
const ReaderContent = observer((props) => {
  const {book, box, pageno, store} = props;
  const {width, height, top, left} = box; 
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
      marginTop: pageno===1 ? 0 : (maxPicHeight - horizontalScale * page.height)
    }
  }
  const PageNavButtons = observer(() => {
    if (store.showPageTurn) {
      return (
        <div>
          <button className="next-link" onClick={store.nextPage}>
            <img src={NextArrow} alt="next"/>Next
          </button>
          <button className="back-link" onClick={store.backPage}>
            <img src={BackArrow} alt="back"/>Back
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
        <img src={"https://tarheelreader.org"+book.pages[0].url} className="pic" 
          style={picStyle} alt="" />
        <PageNavButtons />
      </div>
    );
  } else if (pageno <= book.pages.length) {
    return (
      <div className="book-page" style={pageStyle}>
        <p className="page-number">{pageno}</p>
        <img src={"https://tarheelreader.org"+page.url}
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
  const { word, index, style, store, doResponse } = props;
  const aStyle = {
    display: 'inline-block',
    background: 'solid',
    textAlign: 'center',
    padding: 0,
    ...style
  };
  const maxSize = Math.min(style.width, style.height);
  const fontSize = maxSize / 5;
  const iconSize = maxSize - fontSize - 10;
  const iStyle = {
    width: iconSize
  };
  const cStyle = {
    fontSize,
    marginTop: -fontSize/4
  };
  const isFocused = store.responseIndex===index;
  return (
    <button className="iconButton"
      onClick={() => doResponse(word)}
      style={aStyle}
      ref={(input) => input && isFocused && input.focus()} 
      onFocus={(e) => store.setResponseIndex(index)} >
      <figure>
        <img src={process.env.PUBLIC_URL + "/images/"+word+".png"} alt={word} style={iStyle} />
        <figcaption style={cStyle}>{word}</figcaption>
      </figure>
    </button>
  )
})

const Words = observer((props) => {
  const {store, boxes, responses, doResponse } = props;
  var words = responses;
  var index = 0;

  return (
    <div>
    { boxes.map((box, i) => {
    const nchunk = Math.floor(words.length / (boxes.length - i));
    const chunk = words.slice(0, nchunk);
    words = words.slice(nchunk);
    const { pax, sax } = {'v': { pax: 'height', sax: 'width' },
                          'h': { pax: 'width', sax: 'height' }}[box.align];
    var bstyle = {};
    bstyle[pax] = box[pax] / nchunk;
    bstyle[sax] = box[sax];
    const dstyle = { top: box.top, left: box.left, width: box.width, height: box.height,
      position: 'absolute'};
    return (
      <div key={i} style={dstyle}>
        {
          chunk.map((w, j) => {
            return (
              <WordIcon key={w} word={w} index={index++} style={bstyle} store={store}
                doResponse={doResponse} />
            )
          })
        }
      </div>
    )
  })
    }
  </div>)
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
});

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const Layout = observer((props) => {
  const store = props.store;
  const sides = ['left', 'right', 'top', 'bottom'];
  const onCheck = (e) => store.setLayout(e.target.name, e.target.checked);
  return (
    <fieldset>
      <legend>Layout</legend>
      {
        sides.map(side => (
          <label key={side}>{capitalize(side)}:
            <input name={side} type="checkbox" checked={store.layout[side]}
              onChange={onCheck} />
          </label>))
      }
    </fieldset>)
});

const ReadingSelector = observer((props) => {
  const { value, max, set } = props;
  const spelled = [ 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
                    'eleventh', 'twelth' ];
  const options = spelled.slice(0, max).map((option, i) => (
    <option key={option} value={i} >{option}</option>));
  return (
    <select value={value} onChange={(e) => set(+e.target.value)}>
      {options}
    </select>
  )
});
  
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
          <label>Reading:&nbsp; 
            <ReadingSelector value={store.reading} max={store.nreadings} set={store.setReading} />
          </label>
          <Layout store={store} />
          <label>Size:&nbsp;
            <input type="range" min="0" max="100" value={store.responseSize}
              onChange={e => store.setResponseSize(e.target.value)} />
          </label>
          <label>Page Navigation:&nbsp;
            <input type="checkbox" checked={store.showPageTurn}
              onChange={store.togglePageTurn} />
          </label>

          <button onClick={store.toggleControls} aria-label="Close settings">Done</button>
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
  const sc = store.screen;
  const rs = Math.hypot(sc.width, sc.height) * (0.04 + 0.1*store.responseSize/100);
  var cbox = {
    width: sc.width,
    height: containerHeight,
    left: 0,
    top: 0
  };
  var rboxes = []; // boxes for responses
  if (store.layout.left) {
    cbox.width -= rs;
    cbox.left = rs;
    rboxes.push({ top: 0, left: 0, height: cbox.height, width: rs, align: 'v' });
  }
  if (store.layout.right) {
    cbox.width -= rs;
    rboxes.push({ top: 0, left: sc.width-rs, height: cbox.height, width: rs, align: 'v'});
  }
  if (store.layout.top) {
    cbox.height -= rs;
    cbox.top = rs;
    rboxes.push({ top: 0, left: cbox.left, height: rs, width: cbox.width, align: 'h'});
  }
  if (store.layout.bottom) {
    cbox.height -= rs;
    rboxes.push({ top: containerHeight-rs, left: cbox.left, height: rs, width: cbox.width,
                  align: 'h'});
  }
  const containerStyle = {
    width: store.screen.width,
    height: store.screen.height - 30,
    position: 'absolute',
    left: 0,
    top: commentHeight
  };
  const sayWord = (word) => {
    var msg = new SpeechSynthesisUtterance(word);
    msg.lang = 'en-US';

    speechSynthesis.speak(msg);
  }
  return (
    <div style={pageStyle}>
      <div style={commentStyle}>{comment}</div>
      <div style={containerStyle}>
        <ReaderContent box={cbox} book={book} pageno={store.pageno} store={store} />
        <Words boxes={rboxes} responses={responses} store={store} doResponse={sayWord} />
        <Controls store={store} npages={store.npages} />
      </div>
    </div>
  );
});

export default Reader;
