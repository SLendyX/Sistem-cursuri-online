import React from "react";

export default function({divClass, pClass, changeFlag, children, ...props}){
    const [isVisible, setIsVisible] = React.useState(true)
    const saved = localStorage.getItem("modalHidden");

    React.useEffect(() => {
        setIsVisible(saved === "true" ? false : true)

        const timeoutId = setTimeout(() => {
            setIsVisible(false);
            localStorage.setItem("modalHidden", "true");
        }, 10000);

        return () => clearTimeout(timeoutId);
    }, [changeFlag]);

    function closePopUp() {
        setIsVisible(false);
        localStorage.setItem("modalHidden", "true");
    }

    return(
        <div className={divClass} style={{display: isVisible ? "" : "none"}}>
            <div className="btn-container">
                <p className={pClass}>
                    {children}
                </p>
                <button onClick={closePopUp} className="close-modal">x</button>
            </div>
        </div>   
    )
}