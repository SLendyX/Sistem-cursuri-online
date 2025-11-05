import React from "react";

export default function({curs, ...props}){
    const {numeCurs, imagine, descriere, pret, autor} = curs
    return (
        <div className="course-card" {...props}>
            <h3>{numeCurs}</h3>
            <img className="course-thumbnail" src={imagine} alt={numeCurs} />
            <div className="course-info">
                <p className="course-description">{descriere}</p>
            </div>
            <div className="course-footer">
                <p className="course-price">Price: {pret}</p>
                <p className="course-author">By {autor}</p>
            </div>
        </div>
    )
}