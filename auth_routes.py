#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from flask_login import login_required, current_user, login_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import random
import logging
import uuid
import re

from models import db, User
from main import send_verification_email

# Blueprint tanımlaması
auth = Blueprint('auth', __name__)

logger = logging.getLogger(__name__)

# Şifre sıfırlama fonksiyonları kaldırıldı