import * as React from 'react';

interface BookProps {
    title: string;
    author: string;
    slug: string;
}

interface BookState {

}

export default class Book extends React.Component<BookProps, BookState> {
    constructor () {
        super();
    }

    render() {
        return (
            <div className="book">
                <p className="book-title">{this.props.title}</p>
                <p className="book-author">{this.props.author}</p>
                <p className="book-slug" hidden={true}>{this.props.slug}</p>
            </div>
        );
    }
}