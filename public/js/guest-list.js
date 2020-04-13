//import React, { useState, useEffect } from "react";

const useState = React.useState;
const useEffect = React.useEffect;

const meetId = $("#meetup-id").text();
const guestPostRoute = "/events/" + meetId + "/guests";
const guestListRoute = "/events/" + meetId + "/guests-full";
const guestDeleteRoute = "/events/" + meetId + "/guests/";
const invitesRoute = "/events/" + meetId + "/invites";

const rootElement = document.getElementById("guest-list");
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    rootElement
);

function App() {
    const [guests, setGuests] = useState([]);
    const xhrDelete = new XMLHttpRequest();
    xhrDelete.onload = () => { console.log(xhrDelete.responseText); };

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
            setGuests([...guests, { email: newGuestEmail, status: 0, sent: 0 }]);
        }
    }

    function deleteGuest(props) {
        xhrDelete.open("DELETE", guestDeleteRoute + props.guest.email);
        xhrDelete.send();
        let newGuests = guests.filter((guest, index) => (index !== props.id));
        setGuests(newGuests);
    }

    return (
        <div className="App ">
            <GuestHeader numGuests={guests.length} />
            <ul className="list-group mb-3">
                {guests.map((guest, index) => (
                    <GuestLine key={index} id={index} guest={guest} onDelete={deleteGuest} />
                ))}
            </ul>
            <GuestAdd addGuest={addGuest} />
            <SendInvites />
        </div>
    );
}

function GuestHeader(props) {
    return (
        <h3 className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-shadow">Guest List</span>
            <span className="badge badge-secondary badge-pill">{props.numGuests}</span>
        </h3>
    );
}

function GuestLine(props) {

    return (
        <li className="event-detail list-group-item d-flex lh-condensed" >

            <input
                type="image"
                src="/images/Orange_x.svg.png"
                className="guest-delete-button guest-text"
                onClick={() => { props.onDelete(props); }} />

            <div className="guest-text guest-email">
                {props.guest.email}
            </div>

            <div className="guest-text guest-status" >
                {props.guest.sent === 0 && ('-')}
                {props.guest.sent === 1 && ('invited')}
            </div>

            <div className="guest-text guest-status" >
                {props.guest.status === 2 && (<span className="text-success">Yes</span>)}
                {props.guest.status === 1 && (<span className="text-warning">Maybe</span>)}
                {props.guest.status === 0 && (<span className="text-muted">No RSVP</span>)}
                {props.guest.status === -1 && (<span className="text-danger">No</span>)}
            </div>

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
        <form className="mb-2" onSubmit={SubmitGuest} >
            <input
                name="email"
                type="email"
                onChange={handleChange}
                value={email}
                placeholder="Guest email"
                className="guest-email-input" />
            <span className="p-2">press [enter] to add guest.</span>
        </form>
    );
}

function SendInvites(props) {
    return (
        <div>
            <a href={invitesRoute} className="btn btn-secondary">Send invitations</a>
            <div>
                <small>to new guests only</small>
            </div>
        </div>
    );
}


