const fs = require('fs');

const path = 'server/controllers/authController.js';
let text = fs.readFileSync(path, 'utf8');

const targetStr = `            access_code: token,
            is_registered: false
        });

        res.json({ success: true, user: newUser });
    } catch (e) {`;

const newStr = `            access_code: token,
            is_registered: false
        });

        if (req.body.guestId) {
            const { AllowedGuest } = await import('../models.js');
            await AllowedGuest.findByIdAndUpdate(req.body.guestId, {
                isClaimed: true,
                claimedBy: newUser._id
            });
        }

        res.json({ success: true, user: newUser });
    } catch (e) {`;

if(text.includes(targetStr)) {
    text = text.replace(targetStr, newStr);
    fs.writeFileSync(path, text);
    console.log("Updated authController successfully");
} else {
    console.log("Could not find target string in authController");
}
