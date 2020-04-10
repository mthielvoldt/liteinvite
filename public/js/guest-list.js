//import React, { useState, useEffect } from "react";

const useState = React.useState;
const useEffect = React.useEffect;

const meetId = $("#meetup-id").text();
const guestPostRoute = "/events/" + meetId + "/guests";
const guestListRoute = "/events/" + meetId + "/guests-full";
console.log("meetId: " + meetId);

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
        fetch(guestListRoute)
            .then(res => res.json())
            .then((fetchedGuests) => {
                setGuests(fetchedGuests);
            })
            .catch(error => console.log(error));
    }, []);

    function addGuest(newGuestEmail) {

        // Check to see if this email has been entered before (case-insensitive match)
        const hasMatch = guests.some((guest) => guest.email.toUpperCase() === newGuestEmail.toUpperCase());

        if (hasMatch) {
            console.log("email matches one previously entered.");
        } else {
            setGuests([...guests, { email: newGuestEmail, status: 0 }]);
        }
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
            <span>Guest List</span>
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
        <li className="event-item list-group-item d-flex justify-content-between lh-condensed">

            <h5 className="my-0">{(props.guest.name) ? props.guest.name : props.guest.email}</h5>

            {props.guest.status === 2 && (<h5 className="text-success">Coming</h5>)}
            {props.guest.status === 1 && (<h5 >Maybe</h5>)}
            {props.guest.status === 0 && (<h5 >No RSVP</h5>)}
            {props.guest.status === -1 && (<h5>'\u2718'</h5>)}

        </li>
    );
}

function ajaxSuccess() {
    console.log(this.responseText);
}
var oReq = new XMLHttpRequest();
oReq.onload = ajaxSuccess;


function GuestAdd(props) {
    const [email, setEmail] = useState("");

    function SubmitGuest(event) {

        // Here, we pass this email string to the parent component.
        props.addGuest(email);

        oReq.open("POST", guestPostRoute); //oFormElement.action
        oReq.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
        oReq.send(email);
        setEmail("");       // clear the input box. 
        event.preventDefault();
    }

    function handleChange(event) {
        let newEmail = event.target.value;      // pull out the "value" attribute. 
        setEmail(newEmail);
    }

    return (
        // for some reason, this is enctype="multipart/form-data".  Figure out why. 
        <form className="card p-2 mb-2" onSubmit={SubmitGuest} >
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


