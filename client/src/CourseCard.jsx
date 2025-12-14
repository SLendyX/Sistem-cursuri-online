import React from "react";
import Rating from '@mui/material/Rating';
import Divider from '@mui/material/Divider';

export default function({curs, ...props}){
    const { nume_curs, thumbnail_url, dificultate, nr_proiecte, studenti_inrolati, descriere, pret, rating, autor_id } = curs;

    return (
        <div className="course-card" {...props}>
            <h3 className="course-title">{nume_curs}</h3>
            <img 
                className="course-thumbnail" 
                src={thumbnail_url || '/images/default.jpg'} 
                alt={nume_curs} 
            />
            <div className="course-info">
                <p className="course-description">{descriere}</p>
            </div>

            <Divider flexItem />

            <div className="course-info">
                <p className="course-students-enrolled">👤 {studenti_inrolati} Students</p>
                    <p>📁 {nr_proiecte} Projects</p>
            </div>

            <div className="course-footer">
                
                <p className="course-price">${pret}</p>
                <p className="course-author">By <b>{autor_id}</b></p>
            </div>

            <label className={`course-difficulty course-difficulty-${dificultate}`}>{dificultate}</label>
            <div className="course-rating">
                <Rating readOnly defaultValue={rating}/>
                <label className="course-review-number">(20)</label>
            </div>
        </div>
    )
}