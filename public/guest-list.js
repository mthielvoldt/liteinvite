//import React, { useState, useEffect } from "react";

const useState = React.useState;
const useEffect = React.useEffect;



const rootElement = document.getElementById("guest-list");
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    rootElement
);

function App() {
    const [guests, setGuests] = useState([]);

    // run only once at page-load to populate the guest-list
    useEffect(() => {
        fetch("/ajax-info.json")
            .then(res => res.json())
            .then((fetchedGuests) => {
                setGuests(fetchedGuests);
            })
            .catch(error => console.log(error));
    }, []);

    function addGuest(newGuestName) { 
        setGuests( [...guests, {name: newGuestName}] );
    }

    return (
        <div className="App ">
            <GuestHeader numGuests={guests.length} />
            <GuestList guests={guests} />
            <GuestAdd addGuest={addGuest} />
            <SendInvites />
        </div>
    );
}

function GuestHeader(props) {
    return (
        <h3 className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">Guest List</span>
            <span className="badge badge-secondary badge-pill">{props.numGuests}</span>
        </h3>
    );
}
function GuestList(props) {
    return (
        <ul className="list-group mb-3">
            {props.guests.map((guest, index) => (
                <GuestLine guest={guest} key={index} />
            ))}
        </ul>
    );
}
function GuestLine(props) {
    return (
        <li className="list-group-item d-flex justify-content-between lh-condensed">
            <div>
                <h6 className="my-0">{props.guest.name}</h6>
            </div>
            <strong className="text-success">&#10004;</strong>
        </li>
    );
}

function ajaxSuccess() {
    console.log(this.responseText);
}
var oReq = new XMLHttpRequest();
oReq.onload = ajaxSuccess;


function GuestAdd(props) {
    const [ email, setEmail] = useState("");

    function SubmitGuest(event) {
        
        let oFormElement = event.target;
    
        let formData = new FormData(oFormElement);
        for ( let value of formData.values()) {
            console.log(value);
            props.addGuest(value);
        }
        oReq.open("post", oFormElement.action);
        oReq.send(formData);
        setEmail("");       // clear the input box. 
        event.preventDefault();
    }

    function handleChange(event) {
        let newEmail = event.target.value;      // pull out the "value" attribute. 
        setEmail(newEmail);
    }

    return (
        // for some reason, this is enctype="multipart/form-data".  Figure out why. 
        <form className="card p-2 mb-2" action="/guest" method="POST" onSubmit={SubmitGuest} >
            <div className="input-group">
                <input name="email" type="email" onChange={handleChange} value={email} placeholder="Guest email" />
                <div className="input-group-append" />
            </div>
            <input type="submit" className="btn btn-secondary" value="Add Guests" />
        </form>
    );
}

function SendInvites(props) {
    return (
        <div>
            <button className="btn btn-secondary">Send invitations</button>
            <div>
                <small className="text-muted">to new guests only</small>
            </div>
        </div>
    );
}


