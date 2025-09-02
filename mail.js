// Initialize Firebase
const database = firebase.database();

// ⭐ Handle star rating
const stars = document.querySelectorAll("#starRating i");
const ratingInput = document.getElementById("rating");

stars.forEach(star => {
  star.addEventListener("click", () => {
    const value = star.getAttribute("data-value");
    ratingInput.value = value;

    // Highlight stars up to selected
    stars.forEach(s => {
      if (s.getAttribute("data-value") <= value) {
        s.classList.add("text-yellow-400");
        s.classList.remove("text-gray-400");
      } else {
        s.classList.add("text-gray-400");
        s.classList.remove("text-yellow-400");
      }
    });
  });
});

// Handle review form submit
document.getElementById("reviewForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("email").value;
  const serviceNeeded = document.getElementById("serviceNeeded").value;
  const message = document.getElementById("message").value;
  const rating = ratingInput.value;

  // get selected profile
    // ✅ get selected profile (required)
  const selectedProfile = document.querySelector('input[name="profilePic"]:checked');
  if (!selectedProfile) {
    alert("⚠️ Please select your meow profile.");
    return; // stop form submit if no profile chosen
  }
  const profileUrl = selectedProfile.value;


  const review = {
    firstName,
    lastName,
    email,
    serviceNeeded,
    message,
    rating: parseInt(rating), // make sure it's a number
    profileUrl,
    timestamp: new Date().toISOString()
  };

  database.ref("reviews").push(review).then(() => {
    alert("✅ Thank you! Your feedback has been submitted.");
    document.getElementById("reviewForm").reset();

    // reset stars
    stars.forEach(s => {
      s.classList.remove("text-yellow-400");
      s.classList.add("text-gray-400");
    });
  }).catch((error) => {
    console.error("Error saving review:", error);
  });
});


// ======================
// ⭐ Sync reviews into Feedback Section
// ======================
const feedbackList = document.getElementById("feedbackList");

database.ref("reviews").on("child_added", function(snapshot) {
  const data = snapshot.val();

  // Generate stars
  let starHTML = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= data.rating) {
      starHTML += `<i class="fas fa-star text-yellow-400"></i>`;
    } else {
      starHTML += `<i class="fas fa-star text-gray-300"></i>`;
    }
  }

  // Create feedback card
  const div = document.createElement("div");
  div.classList.add("flex", "items-start", "space-x-4", "p-4", "border-b");

  div.innerHTML = `
    <img src="${data.profileUrl || 'https://i.pravatar.cc/100'}" 
         alt="Profile" 
         class="w-12 h-12 rounded-full object-cover">
    <div>
      <h4 class="font-semibold">${data.firstName} ${data.lastName}</h4>
      <p class="text-sm text-gray-500 mb-1">${data.serviceNeeded}</p>
      <div class="flex mb-2">${starHTML}</div>
      <p class="text-gray-700 mb-2">"${data.message}"</p>
      <span class="text-xs text-gray-400">${new Date(data.timestamp).toLocaleString()}</span>
    </div>
  `;

  feedbackList.prepend(div); // newest first
});
